var dialogs = require('../dialogs/serviceDialogs')

var Dialogs = {
    getDialogs: function (builder) {
        var RSHTramo = new dialogs.RSHTramo(builder);

        return [
            { dialogId: RSHTramo.dialogId, dialog: RSHTramo.dialog }, //ObtenerTramoRsh
        ]
    }
}

module.exports = Dialogs;