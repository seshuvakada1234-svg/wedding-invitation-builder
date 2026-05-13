
export const ADMIN_EMAILS = [
  "resumepro.ads@gmail.com",
  "seshuvakada1234@gmail.com",
];

export const isAdminUser = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};
