import { SQLDatabase } from "encore.dev/storage/sqldb";

export default new SQLDatabase("deid_db", {
  migrations: "./migrations",
});
