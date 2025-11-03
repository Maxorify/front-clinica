import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CajaPagos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    metodoPago: 'Efectivo',
    monto: '',
    concepto: '',
    descuento: 0,
    observaciones: ''
  });

  const [pagosHoy] = useState([
    {
      id: 1,
      paciente: 'Mar�a Gonz�lez',
      cedula: '1234567890',
      servicio: 'Consulta General',
      doctor: 'Dr. Garc�a',
      monto: 50,
      estado: 'Pendiente',
      hora: '09:00'
    },
    {
      id: 2,
      paciente: 'Juan P�rez',
      cedula: '0987654321',
      servicio: 'Consulta Especializada',
      doctor: 'Dra. Mart�nez',
      monto: 80,
      estado: 'Pagado',
      hora: '09:30',
      metodoPago: 'Tarjeta'
    },
    {
      id: 3,
      paciente: 'Ana L�pez',
      cedula: '1122334455',
      servicio: 'Control',
      doctor: 'Dr. Garc�a',
      monto: 40,
      estado: 'Pagado',
      hora: '10:00',
      metodoPago: 'Efectivo'
    },
    {
      id: 4,
      paciente: 'Carlos Ruiz',
      cedula: '5544332211',
      servicio: 'Consulta General',
      doctor: 'Dr. Rodr�guez',
      monto: 50,
      estado: 'Pendiente',
      hora: '10:30'
    }
  ]);

  const getEstadoColor = (estado) => {
    return estado === 'Pagado'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  const filteredPagos = pagosHoy.filter(
    (p) =>
      p.paciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cedula.includes(searchTerm) ||
      p.servicio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePayment = (pago) => {
    setSelectedPayment(pago);
    setPaymentForm({
      metodoPago: 'Efectivo',
      monto: pago.monto.toString(),
      concepto: pago.servicio,
      descuento: 0,
      observaciones: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    console.log('Procesando pago:', { ...selectedPayment, ...paymentForm });
    alert('Pago procesado exitosamente');
    setShowPaymentModal(false);
    setSelectedPayment(null);
  };

  const calcularTotal = () => {
    const monto = parseFloat(paymentForm.monto) || 0;
    const descuento = parseFloat(paymentForm.descuento) || 0;
    return monto - (monto * descuento / 100);
  };

  const totalPagado = pagosHoy.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.monto, 0);
  const totalPendiente = pagosHoy.filter(p => p.estado === 'Pendiente').reduce((sum, p) => sum + p.monto, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Caja de Pagos</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Gesti�n de pagos y cobros</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Total Cobrado</h3>
          <p className="text-4xl font-bold mt-2">${totalPagado}</p>
          <p className="text-sm opacity-80 mt-1">Hoy</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Por Cobrar</h3>
          <p className="text-4xl font-bold mt-2">${totalPendiente}</p>
          <p className="text-sm opacity-80 mt-1">Pendientes</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Transacciones</h3>
          <p className="text-4xl font-bold mt-2">{pagosHoy.length}</p>
          <p className="text-sm opacity-80 mt-1">Hoy</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold opacity-90">Total Esperado</h3>
          <p className="text-4xl font-bold mt-2">${totalPagado + totalPendiente}</p>
          <p className="text-sm opacity-80 mt-1">Hoy</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por paciente, c�dula o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
          />
          <svg
            className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  C�dula
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPagos.map((pago) => (
                <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{pago.hora}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{pago.paciente}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{pago.cedula}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{pago.servicio}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{pago.doctor}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">${pago.monto}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(pago.estado)}`}>
                      {pago.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {pago.estado === 'Pendiente' ? (
                      <button
                        onClick={() => handlePayment(pago)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Cobrar
                      </button>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pago.metodoPago}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPagos.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No hay pagos registrados</h3>
            <p className="text-gray-600 dark:text-gray-400">No se encontraron pagos con los criterios de b�squeda</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Procesar Pago</h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
              {/* Patient Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Paciente:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPayment.paciente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Servicio:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPayment.servicio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Doctor:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPayment.doctor}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  M�todo de Pago
                </label>
                <select
                  value={paymentForm.metodoPago}
                  onChange={(e) => setPaymentForm({ ...paymentForm, metodoPago: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta de Cr�dito/D�bito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentForm.monto}
                  onChange={(e) => setPaymentForm({ ...paymentForm, monto: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={paymentForm.descuento}
                  onChange={(e) => setPaymentForm({ ...paymentForm, descuento: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones
                </label>
                <textarea
                  rows="3"
                  value={paymentForm.observaciones}
                  onChange={(e) => setPaymentForm({ ...paymentForm, observaciones: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>

              {/* Total */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total a Cobrar:</span>
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                    ${calcularTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar Pago
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
