CREATE SCHEMA login_cad;
USE login_cad;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listas_de_filmes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_filme VARCHAR(20) NOT NULL,
    titulo_filme VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    tipo_lista VARCHAR(50) NOT NULL, -- 'assistir', 'assistidos', 'favoritos'
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY (id_usuario, id_filme, tipo_lista)
);

SELECT * FROM login_cad.usuarios;

DELETE FROM usuarios WHERE id = 27;