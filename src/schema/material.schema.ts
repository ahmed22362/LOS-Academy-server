// teacherId, name, age, course, status
import z from "zod"
const teacherId = z.string({ message: "Please enter the teacherId" })
const name = z.string({
  message: "please provide the name of the material",
})
const age = z.union([
  z.string({
    message: "please provide the age the this material up to!",
  }),
  z.number({
    message: "please provide the age the this material up to!",
  }),
])

const course = z.string({
  message: "please enter the course name that this material is for",
})
const status = z.enum(["new Arrival", "active", "archived"])
export const createMaterialSchema = z.object({
  body: z.object({ teacherId, name, age, course }),
})
