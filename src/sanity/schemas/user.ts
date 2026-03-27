import type { SchemaTypeDefinition } from "sanity"

export const userSchema: SchemaTypeDefinition = {
  name: "user",
  title: "User",
  type: "document",
  fields: [
    {
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    },
    {
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "passwordHash",
      title: "Password Hash",
      type: "string",
      hidden: true,
    },
    {
      name: "isVerified",
      title: "Email Verified",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "createdAt",
      title: "Created At",
      type: "datetime",
    },
  ],
}
