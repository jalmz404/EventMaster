<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correo   = trim($_POST['correo']   ?? '');
    $password = $_POST['password'] ?? '';

    // ── Validaciones básicas ──────────────────────────────────────────────
    if (!$correo || !$password) {
        echo json_encode(["status" => "error", "message" => "Por favor ingresa correo y contraseña."]);
        exit;
    }

    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "error", "message" => "El correo electrónico no es válido."]);
        exit;
    }

    if (strlen($password) < 6) {
        echo json_encode(["status" => "error", "message" => "La contraseña debe tener al menos 6 caracteres."]);
        exit;
    }

    try {

        $check = $conexion->prepare("SELECT id_organizador FROM organizadores WHERE correo = :correo");
        $check->bindParam(":correo", $correo);
        $check->execute();

        if ($check->fetch()) {
            echo json_encode(["status" => "error", "message" => "Ya existe una cuenta con ese correo."]);
            exit;
        }

        // ── Insertar nuevo organizador ────────────────────────────────────
        $stmt = $conexion->prepare(
            "INSERT INTO organizadores (correo, password) VALUES (:correo, :password)"
        );
        $stmt->bindParam(":correo",   $correo);
        $stmt->bindParam(":password", $password);
        $stmt->execute();

        $nuevoId = $conexion->lastInsertId();

        // Iniciar sesión automáticamente tras el registro
        $_SESSION['id_organizador'] = $nuevoId;

        echo json_encode([
            "status"  => "success",
            "message" => "Cuenta creada exitosamente. Redirigiendo..."
        ]);

    } catch (PDOException $e) {
        echo json_encode([
            "status"  => "error",
            "message" => "Error en la base de datos: " . $e->getMessage()
        ]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Método no permitido."]);
}
?>