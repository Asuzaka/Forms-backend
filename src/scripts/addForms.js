const mongoose = require("mongoose");
const User = require("../models/userModel"); // Adjust path if needed
const Form = require("../models/formModel"); // Your form schema file

const MONGO_URI = "mongodb://localhost:27017/Forms"; // update this

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected ✅");

    // Step 1: Check or create a user
    let user = await User.findOne({ email: "demo@example.com" });

    if (!user) {
      user = await User.create({
        name: "Demo User",
        email: "demo@example.com",
        password: "demo1234",
        passwordConfirm: "demo1234",
        isVerified: true,
      });
      console.log("New user created ✅");
    } else {
      console.log("User already exists ✅");
    }

    // Step 2: Add some demo forms
    const demoForms = [
      {
        topic: "education",
        title: "JavaScript Quiz",
        description: "A basic JS quiz",
        image: "https://example.com/js.png",
        creator: user._id,
        publish: true,
        publishUrl: "js-quiz-1",
        questions: [
          {
            id: "q1",
            type: "singleLine",
            required: true,
            text: "What is JavaScript?",
            visible: true,
            answer: "",
            placeholder: "Type your answer",
            maxLength: 100,
          },
        ],
        seen: new Date(),
        thumbail: "https://example.com/js-thumb.png",
      },
      {
        topic: "quiz",
        title: "React Basics",
        description: "Test your React knowledge",
        image: "https://example.com/react.png",
        creator: user._id,
        publish: false,
        publishUrl: "",
        questions: [
          {
            id: "q1",
            type: "multiLine",
            required: false,
            text: "Explain React components.",
            visible: true,
            answer: "",
            lines: 3,
            placeholder: "Write your explanation...",
          },
        ],
        seen: new Date(),
        thumbail: "https://example.com/react-thumb.png",
      },
    ];

    await Form.insertMany(demoForms);
    console.log("Forms created successfully ✅");

    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

run();
