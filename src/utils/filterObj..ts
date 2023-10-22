import { Op } from "sequelize"

type WhereObject = Record<string, any>

const filterObj = (
  obj: Record<string, any>,
  ...allowedFields: string[]
): WhereObject => {
  let whereObj: WhereObject = {}
  allowedFields = allowedFields.flat(Infinity)

  const whereClause = Object.entries(obj)
    .filter(([param]) => allowedFields.includes(param))
    .map(([param, value]) => {
      if (param === "id") {
        return { [param]: parseInt(value) }
      } else if (param === "userId") {
        return { [param]: parseInt(value) }
      } else if (param === "openAt") {
        return { [param]: parseInt(value) }
      } else if (param === "imageURL") {
        return { [param]: value }
      } else {
        return { [param]: { [Op.iLike]: `%${value.replace(/['"]+/g, "")}%` } }
      }
    })

  if (whereClause.length > 0) {
    whereObj = { [Op.or]: whereClause }
  }

  return whereObj
}

export default filterObj
