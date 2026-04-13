CREATE TABLE klassen (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE schueler (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    klass_id INT REFERENCES klassen(id)
);

CREATE TABLE faecher (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE pruefungen (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    fach_id INT REFERENCES faecher(id)
);

CREATE TABLE eintraege (
    id SERIAL PRIMARY KEY,
    schueler_id INT REFERENCES schueler(id),
    pruefung_id INT REFERENCES pruefungen(id),
    note DECIMAL(3, 2)
);

CREATE TABLE seiten_uploads (
    id SERIAL PRIMARY KEY,
    schueler_id INT REFERENCES schueler(id),
    datei BYTEA
);

CREATE TABLE schueler_klassen (
    schueler_id INT REFERENCES schueler(id),
    klass_id INT REFERENCES klassen(id),
    PRIMARY KEY (schueler_id, klass_id)
);
