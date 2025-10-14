-- Criação do BD
DROP DATABASE IF EXISTS pascomhub;
CREATE DATABASE pascomhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pascomhub;

-- Criação das tabelas
-- Usuário
CREATE TABLE usuarios (
    userid int NOT NULL auto_increment PRIMARY KEY,
    nome varchar(100) NOT NULL,
    email varchar(150) NOT NULL,
    senha varchar(255) NOT NULL,
    tipo enum('Membro', 'Coordenador') NOT NULL DEFAULT 'Membro'
) DEFAULT CHARSET = utf8mb4;

-- Habilidades
CREATE TABLE habilidades (
    habilidadeid int NOT NULL auto_increment PRIMARY KEY,
    nome enum('Mídias Sociais', 'Slides', 'Fotografia', 'Transmissão') NOT NULL
) DEFAULT CHARSET = utf8mb4;

-- Sub-Habilidade
CREATE TABLE subhabilidade (
    subid int auto_increment PRIMARY KEY,
    habilidadeid int NOT NULL,
    nome enum('Fotos Profissionais', 'Fotos com celular', 'Câmera Móvel', 'Câmera Central', 'OBS', 'Feedbacks') NOT NULL,
    FOREIGN KEY (habilidadeid) REFERENCES habilidades(habilidadeid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) DEFAULT CHARSET = utf8mb4;

-- Eventos
CREATE TABLE eventos (
    eventoid int NOT NULL auto_increment PRIMARY KEY,
    data DATE NOT NULL,
    descricao varchar(255),
    horario enum('07h30', '09h30', '19h') NOT NULL
) DEFAULT CHARSET = utf8mb4;

-- Funções de um evento
CREATE TABLE funcoesevento (
    funcaoid INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    eventoid INT NOT NULL,
    habilidadeid INT NOT NULL,
    subid INT NULL,
    idresponsavel INT NULL,
    status ENUM('Livre', 'Ocupado') DEFAULT 'Livre',
    FOREIGN KEY (eventoid) REFERENCES eventos(eventoid),
    FOREIGN KEY (habilidadeid) REFERENCES habilidades(habilidadeid),
    FOREIGN KEY (subid) REFERENCES subhabilidade(subid),
    FOREIGN KEY (idresponsavel) REFERENCES usuarios(userid)
) DEFAULT CHARSET=utf8mb4;

-- Relação do usuário com suas habilidades
CREATE TABLE userhabil (
    userid int NOT NULL,
    habilidade enum('Mídias Sociais', 'Slides', 'Fotografia', 'Transmissão') NOT NULL,
    subhabil enum('Fotos Profissionais', 'Fotos com celular', 'Câmera Móvel', 'Câmera Central', 'OBS', 'Feedbacks', '07h30', '09h30', '19h') NULL,
    FOREIGN KEY (userid) REFERENCES usuarios(userid)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) DEFAULT CHARSET = utf8mb4;

-- Usuários teste
INSERT INTO usuarios (nome, email, senha, tipo) VALUES
('Coordenador Teste', 'coord@example.com', 'coord123', 'Coordenador'),
('Membro Teste', 'membro@example.com', 'membro123', 'Membro');

-- Inserção das habilidades principais
INSERT INTO habilidades (nome)
VALUES 
('Mídias Sociais'),
('Slides'),
('Fotografia'),
('Transmissão');

-- Inserção das sub-habilidades relacionadas
INSERT INTO subhabilidade (habilidadeid, nome)
VALUES
-- Fotografia
(3, 'Fotos Profissionais'),
(3, 'Fotos com celular'),

-- Transmissão
(4, 'Câmera Móvel'),
(4, 'Câmera Central'),
(4, 'OBS'),
(4, 'Feedbacks');