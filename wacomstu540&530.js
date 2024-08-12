var wacomstu540 = function () {

    if (!navigator.hid) {
        alert("WebHID not supported in this browser.");
        return null;
    }

    this.config = {
        vid: 1386,
        pids: [168, 152], // STU-540 (168) and STU-530 (152)
        scaleFactor: 13.5,
        pressureFactor: 1023,
        onPenDataCb: null,
    };

    this.device = null;
    this.command = {
        clearScreen: 0x20 // Commonly used for clearing the screen on Wacom devices
    };

    this.connect = async function () {
        let devices = await navigator.hid.requestDevice({ filters: [{ vendorId: this.config.vid, productIds: this.config.pids }] });
        if (devices.length === 0) {
            alert("No device selected.");
            return false;
        }
        this.device = devices[0];
        await this.device.open();

        let isSTU530 = this.device.productId === 152;
        if (isSTU530) {
            this.config.scaleFactor = 10.6;
            this.config.pressureFactor = 2047;
        }

        this.device.addEventListener("inputreport", event => {
            if (this.config.onPenDataCb) {
                let penData = {
                    sw: (event.data.getUint8(0) & (1 << 1)) !== 0, // Pen contact
                    cx: event.data.getUint16(2) / this.config.scaleFactor,
                    cy: event.data.getUint16(4) / this.config.scaleFactor,
                    press: event.data.getUint16(0) / this.config.pressureFactor
                };
                this.config.onPenDataCb(penData);
            }
        });

        return true;
    };

    /**
     * Clear screen to background color
     */
    this.clearScreen = async function () {
        if (!this.checkConnected()) return;

        const clearCommand = new Uint8Array([0]); // Some devices require just a 0 byte to clear the screen

        try {
            await this.device.sendFeatureReport(this.command.clearScreen, clearCommand);
        } catch (error) {
            console.error("Failed to clear screen: ", error);
        }
    }.bind(this);

    this.checkConnected = function () {
        return this.device != null && this.device.opened;
    }.bind(this);

    this.sendData = async function (reportId, data) {
        if (!this.checkConnected()) return;
        try {
            await this.device.sendFeatureReport(reportId, data);
        } catch (error) {
            console.error("Error sending data to device: ", error);
        }
    }.bind(this);

    this.onPenData = function (callback) {
        this.config.onPenDataCb = callback;
    };
};
