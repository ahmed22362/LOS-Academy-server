// teacherId, name, age, course, status
import z from "zod"
const teacherId = z.string({ required_error: "Please enter the teacherId" })
const name = z.string({
  required_error: "please provide the name of the material",
})
const age = z.union([
  z.string({
    required_error: "please provide the age the this material up to!",
  }),
  z.number({
    required_error: "please provide the age the this material up to!",
  }),
])

const course = z.string({
  required_error: "please enter the course name that this material is for",
})
const status = z.enum(["new Arrival", "active", "archived"])
export const createMaterialSchema = z.object({
  body: z.object({ teacherId, name, age, course }),
})
