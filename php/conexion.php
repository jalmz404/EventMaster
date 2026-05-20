<?php
// Este archivo se encargara de establecer la conexión a la base de datos usando PDO.
$host = "localhost";
$db_name = "eventmaster_db";
$username = "root";
$password = "";

try {
    $conexion = new PDO("mysql:host=" . $host . ";dbname=" . $db_name . ";charset=utf8", $username, $password);
    // Configurar atributos para manejo de errores
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $exception) {
    // Si falla, devolvemos un error en formato JSON para que el JS no se rompa
    echo json_encode(["status" => "error", "message" => "Error de conexión: " . $exception->getMessage()]);
    exit;
}
?>