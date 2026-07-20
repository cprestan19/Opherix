-- Se elimina Company.primaryColor: nunca se conectó a ningún componente
-- visual (violeta es el único color de marca de la app, CLAUDE.md §3) y
-- quedaba como campo huérfano guardado sin efecto real.
ALTER TABLE "Company" DROP COLUMN "primaryColor";
