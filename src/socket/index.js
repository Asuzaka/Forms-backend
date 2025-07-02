const { Server } = require("socket.io");
const cookieParser = require("socket.io-cookie-parser");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Comment = require("../models/commentModel");
const Template = require("../models/templateModel");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FROTEND_ADDRESS,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    cookie: true,
  });

  io.use(
    cookieParser(process.env.JWT_SECRET, {
      secret: process.env.JWT_SECRET,
      signed: true,
    })
  );

  io.use(async (socket, next) => {
    try {
      const token =
        socket.request.signedCookies?.jwt ||
        socket.request.cookies?.jwt ||
        socket.handshake.auth?.token;

      if (!token) throw new Error("No token provided");

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id)
        .select("name email photo")
        .lean();

      if (!user) throw new Error("User not found");

      socket.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
      };

      next();
    } catch (err) {
      console.error(`Auth failed: ${err.message}`);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }

    socket.on("join-template", (templateId) => {
      socket.join(templateId);
    });

    socket.on("leave-template", (templateId) => {
      socket.leave(templateId);
    });

    socket.on("comment:create", async ({ text, templateId }, callback) => {
      try {
        const comment = await Comment.create({
          text,
          user: socket.user._id,
          template: templateId,
        });

        const populatedComment = await Comment.findById(comment._id).populate(
          "user",
          "name photo"
        );

        io.to(templateId).emit("comment:new", populatedComment);
      } catch (err) {
        socket.emit("comment:error", {
          action: "create",
          error: err.message,
        });
      }
    });

    socket.on(
      "comment:edit",
      async ({ commentId, text, templateId }, callback) => {
        try {
          const updatedComment = await Comment.findOneAndUpdate(
            {
              _id: commentId,
              user: socket.user._id,
              template: templateId,
            },
            { text },
            { new: true, runValidators: true }
          ).populate("user", "name photo");

          if (!updatedComment) {
            throw new Error("Comment not found or not authorized to edit");
          }

          io.to(templateId).emit("comment:updated", updatedComment);
        } catch (err) {
          socket.emit("comment:error", {
            action: "edit",
            error: err.message,
          });
        }
      }
    );

    socket.on("comment:delete", async ({ commentId, templateId }, callback) => {
      try {
        const deletedComment = await Comment.findOneAndDelete({
          _id: commentId,
          user: socket.user._id,
          template: templateId,
        });

        if (!deletedComment) {
          throw new Error("Comment not found or not authorized to delete");
        }

        io.to(templateId).emit("comment:deleted", {
          commentId,
          deletedAt: new Date(),
        });
      } catch (err) {
        socket.emit("comment:error", {
          action: "delete",
          error: err.message,
        });
      }
    });

    socket.on("template:like", async (templateId) => {
      try {
        const userId = socket.user._id;

        const template = await Template.findById(templateId);
        if (!template) {
          throw new Error("Template not found");
        }

        if (template.likedBy.includes(userId)) {
          throw new Error("You already liked this template");
        }

        const updatedTemplate = await Template.findByIdAndUpdate(
          templateId,
          {
            $inc: { likes: 1 },
            $addToSet: { likedBy: userId },
          },
          { new: true }
        );

        io.to(templateId).emit("template:liked", {
          templateId,
          likes: updatedTemplate.likes,
          action: "increased",
          userId,
        });
      } catch (err) {
        socket.emit("template:error", {
          action: "like",
          error: err.message,
        });
      }
    });

    socket.on("template:unlike", async (templateId) => {
      try {
        const userId = socket.user._id;

        const template = await Template.findById(templateId);
        if (!template) {
          throw new Error("Template not found");
        }

        if (!template.likedBy.includes(userId)) {
          throw new Error("You haven't liked this template yet");
        }

        const updatedTemplate = await Template.findByIdAndUpdate(
          templateId,
          {
            $inc: { likes: -1 },
            $pull: { likedBy: userId },
          },
          { new: true }
        );

        if (updatedTemplate.likes < 0) {
          updatedTemplate.likes = 0;
          await updatedTemplate.save();
        }

        io.to(templateId).emit("template:liked", {
          templateId,
          likes: updatedTemplate.likes,
          action: "decreased",
          userId,
        });
      } catch (err) {
        socket.emit("template:error", {
          action: "unlike",
          error: err.message,
        });
      }
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

module.exports = setupSocket;
