module.exports = {
  REDIS_URL = "localhost/some/path",
  REDIS_ENV = process.env.NODE_ENV === "development" ? "dev" : "prod"
}