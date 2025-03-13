import * as z from "zod";

export const movieFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  year: z.coerce.number()
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear(), `Year must not be after ${new Date().getFullYear()}`),
  genreId: z.coerce.number({
    required_error: "Please select a genre",
  }),
  actorIds: z.array(z.number()).min(1, "Select at least one actor"),
  directorIds: z.array(z.number()).min(1, "Select at least one director"),
  posterURL: z.string().url("Poster URL must be a valid URL").or(z.literal("")),
  backdropURL: z.string().url("Backdrop URL must be a valid URL").or(z.literal(""))
});

export type MovieFormValues = z.infer<typeof movieFormSchema>;