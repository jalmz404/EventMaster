<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

if (!isset($_SESSION['id_organizador'])) {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

try {
    $id_organizador = $_SESSION['id_organizador'];
    
    // Aquí pedimos id_organizador
    $query = "SELECT * FROM eventos WHERE id_organizador = :id_organizador ORDER BY fecha ASC";
    $stmt = $conexion->prepare($query);
    
    $stmt->bindParam(":id_organizador", $id_organizador);
    
    $stmt->execute();
    $eventos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $eventos]);
    
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>