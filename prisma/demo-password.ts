export function demoPassword() {
  const password = process.env.DEMO_PASSWORD;
  if (
    process.env.NODE_ENV === "production" &&
    (!password || password.length < 16)
  ) {
    throw new Error(
      "Production demo seed requires DEMO_PASSWORD with at least 16 characters.",
    );
  }
  return password || "VeyraDemo2026!";
}
