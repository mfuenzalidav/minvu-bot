const util = require('util')

var Helper = {
    getFormateaFecha: function formateaFecha(fecha)
    {
        var Fecha = 'Sin registro';
        if (!util.isNullOrUndefined(fecha) && fecha !== '0000-00-00') {
            var _fecha = new Date(fecha)
            var dia = _fecha.getDate() < 10 ? `0${_fecha.getDate()}` : `${_fecha.getDate()}`
            var mes = _fecha.getMonth() < 10 ? `0${_fecha.getMonth()}` : `${_fecha.getMonth()}`
            var año = _fecha.getFullYear()
            Fecha = `${dia}/${mes}/${año}`
        }
        return Fecha;
    }
}

module.exports = Helper;