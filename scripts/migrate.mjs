/**
 * Supabase veritabanı migration çalıştırıcı.
 *
 * Kullanım:
 * 1. Supabase Dashboard → Project Settings → Database → Connection string (URI)
 * 2. .env.local dosyasına DATABASE_URL=... ekleyin
 * 3. npm run db:migrate
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "DATABASE_URL tanımlı değil.\n" +
        "Supabase Dashboard → Settings → Database → Connection string (URI) kopyalayın.\n" +
        "Örnek: postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
    );
    process.exit(1);
  }

  const sqlPath = resolve(
    __dirname,
    "../supabase/migrations/001_initial_schema.sql"
  );
  const sql = readFileSync(sqlPath, "utf8");

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Supabase'e bağlanılıyor...");
  await client.connect();

  try {
    console.log("Migration çalıştırılıyor...");
    await client.query(sql);
    console.log("✓ Migration başarıyla tamamlandı!");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("already exists")) {
      console.log("✓ Tablolar zaten mevcut, migration atlandı.");
    } else {
      console.error("Migration hatası:", message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();
