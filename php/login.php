<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correo = $_POST['correo'] ?? '';
    $password_ingresada = $_POST['password'] ?? ''; 

    if (!$correo || !$password_ingresada) {
        echo json_encode(["status" => "error", "message" => "Por favor ingresa correo y contraseña."]);
        exit;
    }

    try {
        $query = "SELECT id_organizador, correo, password FROM organizadores WHERE correo = :correo";
        $stmt = $conexion->prepare($query);
        $stmt->bindParam(":correo", $correo);
        $stmt->execute();

        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($usuario && $usuario['password'] === $password_ingresada) {
            
            $_SESSION['id_organizador'] = $usuario['id_organizador'];

            echo json_encode(["status" => "success", "message" => "Acceso concedido."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Correo o contraseña incorrectos."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Error en la base de datos: " . $e->getMessage()]);
    }
}
?>