export const createCategoryStorageKey = (
  file: Express.Multer.File,
  slug: string,
): string => {
  const extension = file.originalname.split(".").pop() || "png";
  return `categories/${Date.now()}-${slug}.${extension}`;
};

export const createMealStorageKey = (
  file: Express.Multer.File,
  slug: string,
): string => {
  const extension = file.originalname.split(".").pop() || "png";
  return `meals/${Date.now()}-${slug}.${extension}`;
};
export const createProviderStorageKey = (
  file: Express.Multer.File,
  slug: string,
) => {
  const extension = file.originalname.split(".").pop() || "png";
  return `providers/${Date.now()}-${slug}.${extension}`;
};

export const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
