var dialogs = require('../dialogs/serviceDialogs')

var Dialogs = {
    getDialogs: function (builder) {
        var RSHTramo = new dialogs.RSHTramo(builder);
        var SPSEstadoPago = new dialogs.SPSEstadoPago(builder);

        return [
            { dialogId: RSHTramo.dialogId, dialog: RSHTramo.dialog }, //ObtenerTramoRsh
            { dialogId: SPSEstadoPago.dialogId, dialog: SPSEstadoPago.dialog }, //ObtenerTramoRsh
        ]
    }
}

module.exports = Dialogs;