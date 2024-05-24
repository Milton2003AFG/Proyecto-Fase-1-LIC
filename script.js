document.addEventListener('DOMContentLoaded', function() {
    // Datos iniciales del usuario
    const initialUserData = {
      nombre: 'Ash Ketchum',
      pin: '1234',
      cuenta: '0987654321',
      saldo: 500.00
    };
  
    // Guardar datos en localStorage si no existen previamente
    if (!localStorage.getItem('userData')) {
      localStorage.setItem('userData', JSON.stringify(initialUserData));
    }
  
    const loginForm = document.getElementById('loginForm');
  
    // Manejar el formulario de inicio de sesión
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('inputNumeroCuenta').value;
        const pin = document.getElementById('inputPin').value;
        
        // Verificar el PIN
        if (pin === initialUserData.pin) {
          Swal.fire({
            title: '¡Bienvenido!',
            text: `Hola ${initialUserData.nombre}, Número de Cuenta: ${initialUserData.cuenta}`,
            icon: 'success',
            confirmButtonText: 'Continuar'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = 'index.html';
            }
          });
        } else {
          Swal.fire({
            title: 'Error',
            text: 'PIN incorrecto',
            icon: 'error',
            confirmButtonText: 'Intentar de nuevo'
          });
        }
      });
    }
  
    const userDetails = document.getElementById('userDetails');
    let chart; // Variable para almacenar la instancia del gráfico
  
    if (userDetails) {
      // Obtener datos del usuario desde localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      // Mostrar detalles del usuario
      userDetails.innerHTML = `
        <h4>Nombre del dueño de la cuenta: ${userData.nombre}</h4>
        <p>Número de cuenta: ${userData.cuenta}</p>
      `;
  
      // Función para realizar transacciones
      function realizarTransaccion(tipo) {
        Swal.fire({
          title: tipo === 'deposito' ? 'Depositar' : 'Retirar',
          input: 'number',
          inputLabel: 'Cantidad',
          inputPlaceholder: 'Ingrese la cantidad',
          showCancelButton: true,
          confirmButtonText: 'Aceptar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            const cantidad = parseFloat(result.value);
            let saldo = parseFloat(userData.saldo);
  
            // Validar saldo para retiro
            if (tipo === 'retiro' && cantidad > saldo) {
              Swal.fire('Error', 'Saldo insuficiente', 'error');
            } else {
              // Actualizar saldo
              saldo = tipo === 'deposito' ? saldo + cantidad : saldo - cantidad;
              userData.saldo = saldo;
              localStorage.setItem('userData', JSON.stringify(userData));
  
              // Guardar transacción
              const transacciones = JSON.parse(localStorage.getItem('transacciones')) || [];
              transacciones.push({ tipo, cantidad, fecha: new Date().toLocaleString() });
              localStorage.setItem('transacciones', JSON.stringify(transacciones));
  
              Swal.fire('Éxito', `${tipo === 'deposito' ? 'Depósito' : 'Retiro'} realizado con éxito`, 'success');
              actualizarHistorial();
              actualizarGrafico();
            }
          }
        });
      }
  
      // Función para consultar saldo
      function consultarSaldo() {
        Swal.fire('Saldo', `Tu saldo es: $${userData.saldo.toFixed(2)}`, 'info');
      }
  
      // Función para pagar servicios (usa la misma lógica de transacción)
      function pagarServicios() {
        realizarTransaccion('pago de servicios');
      }
  
      // Función para borrar datos del usuario
      function borrarDatos() {
        Swal.fire({
          title: '¿Estás seguro?',
          text: "¡No podrás revertir esto!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, bórralo!'
        }).then((result) => {
          if (result.isConfirmed) {
            localStorage.removeItem('transacciones');
            localStorage.removeItem('userData');
            Swal.fire(
              '¡Eliminado!',
              'Tus datos han sido borrados.',
              'success'
            ).then(() => {
              location.reload(); // Recargar la página para aplicar los cambios
            });
          }
        });
      }
  
      // Función para actualizar el historial de transacciones
      function actualizarHistorial() {
        const transacciones = JSON.parse(localStorage.getItem('transacciones')) || [];
        const transaccionesDiv = document.getElementById('transacciones');
        transaccionesDiv.innerHTML = transacciones.map(transaccion => `
          <p>${transaccion.fecha} - ${transaccion.tipo} - $${transaccion.cantidad.toFixed(2)}</p>
        `).join('');
      }
  
      // Función para actualizar el gráfico de transacciones
      function actualizarGrafico() {
        const transacciones = JSON.parse(localStorage.getItem('transacciones')) || [];
        const tipos = ['deposito', 'retiro', 'pago de servicios'];
        const cantidades = tipos.map(tipo => transacciones.filter(t => t.tipo === tipo).reduce((sum, t) => sum + t.cantidad, 0));
  
        if (chart) {
          chart.destroy(); // Destruir el gráfico anterior antes de crear uno nuevo
        }
  
        const ctx = document.getElementById('transaccionesChart').getContext('2d');
        chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Depósitos', 'Retiros', 'Pagos de servicios'],
            datasets: [{
              label: 'Cantidad en $',
              data: cantidades,
              backgroundColor: ['#4CAF50', '#F44336', '#2196F3'],
              borderColor: ['#388E3C', '#D32F2F', '#1976D2'],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                min: 0,
                max: 1000,
                ticks: {
                  stepSize: 100
                }
              }
            }
          }
        });
      }
  
      // Función para imprimir el comprobante en PDF
      function imprimirComprobante() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const userData = JSON.parse(localStorage.getItem('userData'));
        const transacciones = JSON.parse(localStorage.getItem('transacciones')) || [];
  
        doc.setFontSize(16);
        doc.text("Comprobante de Transacciones", 20, 20);
        doc.setFontSize(12);
        doc.text(`Nombre: ${userData.nombre}`, 20, 30);
        doc.text(`Número de cuenta: ${userData.cuenta}`, 20, 40);
        doc.text(`Saldo actual: $${userData.saldo.toFixed(2)}`, 20, 50);
  
        doc.text("Historial de Transacciones:", 20, 70);
        transacciones.forEach((transaccion, index) => {
          doc.text(`${index + 1}. ${transaccion.fecha} - ${transaccion.tipo} - $${transaccion.cantidad.toFixed(2)}`, 20, 80 + index * 10);
        });
  
        doc.save('comprobante.pdf');
      }
  
      // Asignar la función de impresión al botón correspondiente
      document.getElementById('btnImprimirComprobante').addEventListener('click', imprimirComprobante);
  
      // Inicializar el historial y el gráfico al cargar la página
      actualizarHistorial();
      actualizarGrafico();
  
      // Exponer funciones globalmente para ser llamadas desde los botones
      window.realizarTransaccion = realizarTransaccion;
      window.consultarSaldo = consultarSaldo;
      window.pagarServicios = pagarServicios;
      window.borrarDatos = borrarDatos;
    }
  });
  