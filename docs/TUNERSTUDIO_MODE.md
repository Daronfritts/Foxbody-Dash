# TunerStudio Mode

FoxbodyDash can hand its MicroSquirt serial connection to TunerStudio and switch
the Pi desktop to the TunerStudio window.

## Safety model

- FoxbodyDash stops and closes its MicroSquirt reader before launching
  TunerStudio.
- Only a configured or known TunerStudio executable can be launched.
- Returning requests a normal TunerStudio shutdown; it never force-kills the
  program because doing so could discard unsaved tuning work.
- FoxbodyDash reconnects automatically after the TunerStudio process exits.
- The normal dashboard keeps running if TunerStudio is missing or fails to
  launch.

## Bench testing without the ECU

Set this in the FoxbodyDash service environment:

```ini
Environment=FOX_TUNING_SIMULATE=1
```

The TUNE and FOX DASH buttons can then be tested without TunerStudio or the
MicroSquirt connected.

## Pi configuration

If TunerStudio is not installed in a recognized path, set its launcher:

```ini
Environment="FOX_TUNERSTUDIO_COMMAND=/path/to/TunerStudio.sh"
Environment=FOX_TUNING_DISPLAY=:0
Environment=FOX_TUNING_XAUTHORITY=/home/dietpi/.Xauthority
```

After changing the systemd unit:

```bash
sudo systemctl daemon-reload
sudo systemctl restart foxbody-dash
```

The production test must verify the Pi's actual TunerStudio launcher, desktop
display, Xauthority path, and MicroSquirt serial device.
