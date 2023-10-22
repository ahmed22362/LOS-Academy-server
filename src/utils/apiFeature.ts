import { join } from "path"

class APIFeatures {
  public query: any
  public queryString: any

  constructor(query: any, queryString: any) {
    this.query = query
    this.queryString = queryString
  }

  filter() {
    const queryObj = { ...this.queryString }
    const excludedFields = ["page", "sort", "limit", "fields"]
    excludedFields.forEach((el) => delete queryObj[el])
    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    const parsedObj = JSON.parse(queryStr)
    // Check if 'title' exists in the parsed object  to make it regular expression
    if (parsedObj.title) {
      parsedObj.title = { $regex: parsedObj.title, $options: "i" }
    }
    parsedObj.description
      ? (parsedObj.description = { $regex: parsedObj.title, $options: "i" })
      : undefined

    this.query = this.query.find(parsedObj)

    return this
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ")
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort("-createdAt")
    }

    return this
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ")
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select("-__v")
    }

    return this
  }
  paginate() {
    const page = this.queryString.page * 1 || 1
    const limit = this.queryString.limit * 1 || 100
    const skip = (page - 1) * limit
    this.query = this.query.skip(skip).limit(limit)

    return this
  }

  searchByTags() {
    if (this.queryString.tags) {
      // Validate tags is a string
      if (typeof this.queryString.tags !== "string") {
        throw new Error("Tags must be a comma separated string")
      }

      // Trim whitespace
      const tags = this.queryString.tags
        .split(",")
        .map((tag: string) => tag.trim())

      // Allow single tag as string or array
      const tagsQuery = Array.isArray(tags) ? tags : [tags]

      // Lowercase for case insensitive
      const lowerTags = tagsQuery.map((tag) => tag.toLowerCase())

      // Partial match with regex
      const tagsRegex = lowerTags.map((tag) => new RegExp(tag, "i"))

      this.query = this.query.find({
        tags: { $in: tagsRegex },
      })
    }

    return this
  }
}

export = APIFeatures
