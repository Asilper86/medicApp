<?php
$to = $_POST['email'];
$name = isset($_POST['name']) ? $_POST['name'] : 'Usuario';
$subject = "Inicio de sesión en MedicApp";
$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/html; charset=UTF-8\r\n";
$headers .= "From: MedicApp <medicapp@tudominio.com>\r\n";

$message = "
<html>
  <body style='font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;'>
    <div style='max-width: 500px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #eee; padding: 24px;'>
      <h2 style='color: #6366f1;'>¡Hola, $name!</h2>
      <p>Has iniciado sesión correctamente en <b>MedicApp</b>.</p>
      <p style='margin-top: 16px;'>Si no reconoces este acceso, por favor cambia tu contraseña.</p>
      <hr style='margin: 24px 0;'>
      <p style='font-size: 12px; color: #888;'>Este correo es automático, no respondas a este mensaje.</p>
    </div>
  </body>
</html>
";

mail($to, $subject, $message, $headers);
echo "Correo enviado";
?>