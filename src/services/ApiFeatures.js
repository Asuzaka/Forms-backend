class apiFeatures {
  constructor(query, queryString) {
    // this.query = query Model
    // this.queryString = query params
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((element) => {
      delete queryObj[element];
    });

    // Advanced Filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(lte|lt|gt|gte)\b/g,
      (match) => `$${match}`
    );

    this.query.find(JSON.parse(queryString));
    return this;
  }
  pagination() {
    let page = this.queryString.page * 1 || 1;
    let limit = this.queryString.limit * 1 || 7;

    let skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-_id");
    }
    return this;
  }
}

module.exports = apiFeatures;
