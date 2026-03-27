import type { SchemaTypeDefinition } from "sanity"

export const otpTokenSchema: SchemaTypeDefinition = {
  name: "otpToken",
  title: "OTP Token",
  type: "document",
  fields: [
    {
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "codeHash",
      title: "Code Hash",
      type: "string",
      hidden: true,
    },
    {
      name: "loginToken",
      title: "Login Token",
      type: "string",
      hidden: true,
    },
    {
      name: "expiresAt",
      title: "Expires At",
      type: "datetime",
    },
    {
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: ["signup", "login"],
      },
    },
  ],
}
