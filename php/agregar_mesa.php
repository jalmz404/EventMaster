<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_POST['id_evento'] ?? null;
// El JavaScript manda 'capacidad', la recibimos aquí
$capacidad = $_POST['capacidad'] ?? 8;

if (!$id_evento) {
    echo json_encode(["status" => "error", "message" => "ID de evento no proporcionado"]); exit;
}

try {
    //Averiguar qué número de mesa sigue
    $query_num = "SELECT MAX(numero_mesa) as max_num FROM mesas WHERE id_evento = :id_evento";
    $stmt_num = $conexion->prepare($query_num);
    $stmt_num->execute([':id_evento' => $id_evento]);
    $resultado = $stmt_num->fetch(PDO::FETCH_ASSOC);
    $siguiente_numero = ($resultado['max_num'] ? $resultado['max_num'] : 0) + 1;

    $query = "INSERT INTO mesas (id_evento, numero_mesa, capacidad_maxima) VALUES (:id_evento, :numero_mesa, :capacidad_maxima)";
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':id_evento' => $id_evento,
        ':numero_mesa' => $siguiente_numero,
        ':capacidad_maxima' => $capacidad
    ]);

    echo json_encode([
        "status" => "success", 
        "id_mesa" => $conexion->lastInsertId(),
        "numero_mesa" => $siguiente_numero,
        "capacidad" => $capacidad
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>