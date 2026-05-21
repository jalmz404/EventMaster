<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$tipo_catalogo = $_POST['tipo_catalogo'] ?? null; 
$nombre = $_POST['nombre'] ?? null;

if (!$tipo_catalogo || !$nombre) {
    echo json_encode(["status" => "error", "message" => "Faltan datos"]); exit;
}

try {
    // Decidimos a qué tabla insertar dependiendo de lo que mande javascript
    if ($tipo_catalogo === 'tipo_evento') {
        $query = "INSERT INTO tipos_evento (nombre_tipo) VALUES (:nombre)";
    } else {
        $query = "INSERT INTO tipos_vestimenta (nombre_vestimenta) VALUES (:nombre)";
    }

    $stmt = $conexion->prepare($query);
    $stmt->execute([':nombre' => $nombre]);

    // Devolvemos el id
    echo json_encode(["status" => "success", "id" => $conexion->lastInsertId(), "nombre" => $nombre]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>