import { SampleDeviceConfig } from '../types/audit';

export const SAMPLE_CONFIGS: SampleDeviceConfig[] = [
  {
    id: 'cisco-cat9300-core',
    name: 'Cisco Catalyst 9300 Core Switch',
    vendor: 'cisco_ios',
    vendorName: 'Cisco IOS-XE',
    deviceType: 'Switch',
    model: 'C9300-48UXM',
    serialNumber: 'FCW2348L0P9',
    osVersion: '17.09.04a Universal',
    redactedSecretsCount: 4,
    rawText: `!
version 17.9
service timestamps debug datetime msec
service timestamps log datetime msec
service password-encryption
hostname CORE-SW01-DELHI
!
boot-start-marker
boot-end-marker
!
no logging console
enable secret 9 $9$e7xW$REDACTED_ENABLE_SECRET
!
aaa new-model
aaa authentication login default local
aaa authorization exec default local
!
username secadmin privilege 15 secret 9 $9$mJ7K$REDACTED_ADMIN_HASH
!
ip domain-name ntro.gov.in
ip name-server 10.14.2.10 10.14.2.11
!
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
no ip http server
no ip http secure-server
!
banner login ^C
*******************************************************************
* PROPRIETARY SYSTEM - AUTHORIZED GOVERNMENT OF INDIA ACCESS ONLY *
* DISCONNECT IMMEDIATELY IF YOU ARE NOT AN AUTHORIZED OPERATOR    *
*******************************************************************
^C
!
ntp server 10.14.0.1 prefer
ntp server 10.14.0.2
ntp authenticate
ntp authentication-key 1 md5 REDACTED_NTP_KEY 7
ntp trusted-key 1
!
logging host 10.14.5.50
logging trap notifications
logging facility local6
!
snmp-server community REDACTED_COMMUNITY RO
snmp-server group SECGROUP v3 priv
snmp-server user secoper SECGROUP v3 auth sha REDACTED_AUTH priv aes 128 REDACTED_PRIV
!
line con 0
 exec-timeout 10 0
 stopbits 1
line vty 0 4
 exec-timeout 10 0
 transport input ssh
line vty 5 15
 exec-timeout 10 0
 transport input ssh
!
end`
  },
  {
    id: 'juniper-srx345-gateway',
    name: 'Juniper SRX345 Enterprise Firewall',
    vendor: 'juniper_junos',
    vendorName: 'Juniper JunOS',
    deviceType: 'Firewall',
    model: 'SRX345-SYS-JB',
    serialNumber: 'CW0219AF0098',
    osVersion: 'Junos 22.4R2-S2.5',
    redactedSecretsCount: 3,
    rawText: `## Last commit: 2026-08-20 14:12:08 UTC by secadmin
version 22.4R2-S2.5;
system {
    host-name SRX-FW-BORDER-01;
    domain-name ntro.internal;
    time-zone Asia/Kolkata;
    authentication-order password;
    root-authentication {
        encrypted-password "$6$kL9x$REDACTED_ROOT_HASH";
    }
    login {
        message "RESTRICTED SYSTEM - OFFICIAL NTRO INFRASTRUCTURE ONLY";
        class super-user-local {
            permissions all;
        }
        user netops {
            uid 2001;
            class super-user-local;
            authentication {
                encrypted-password "$6$j8Nx$REDACTED_USER_HASH";
            }
        }
    }
    services {
        ssh {
            protocol-version v2;
            connection-limit 5;
            rate-limit 3;
        }
        telnet {
            /* VULNERABILITY INJECTED FOR COMPLIANCE TEST */
        }
        web-management {
            https {
                port 443;
                system-generated-certificate;
            }
        }
    }
    syslog {
        host 10.14.5.50 {
            any warning;
            facility-override local5;
        }
        file messages {
            any notice;
            authorization info;
        }
    }
    ntp {
        server 10.14.0.1;
        server 10.14.0.2;
    }
}
snmp {
    community REDACTED_SNMP_STRING {
        authorization read-only;
    }
    v3 {
        usm {
            local-engine {
                user admin-v3 {
                    authentication-sha {
                        authentication-key "$9$REDACTED_KEY";
                    }
                    privacy-aes128 {
                        privacy-key "$9$REDACTED_KEY";
                    }
                }
            }
        }
    }
}`
  },
  {
    id: 'paloalto-pa3220-dc',
    name: 'Palo Alto PA-3220 Perimeter Firewall',
    vendor: 'palo_alto',
    vendorName: 'Palo Alto PAN-OS',
    deviceType: 'Firewall',
    model: 'PA-3220',
    serialNumber: '012901004882',
    osVersion: 'PAN-OS 11.0.2-h3',
    redactedSecretsCount: 2,
    rawText: `set deviceconfig system hostname PA-NGFW-DELHI-01
set deviceconfig system domain ntro.gov.in
set deviceconfig system timezone Asia/Kolkata
set deviceconfig system ip-address 10.14.1.1 netmask 255.255.255.0 default-gateway 10.14.1.254
set deviceconfig system service disable-telnet yes
set deviceconfig system service disable-http yes
set deviceconfig system ssh-version 2
set deviceconfig system login-banner "GOVERNMENT OF INDIA CONFIDENTIAL NETWORK - LOGGED"
set deviceconfig system idle-timeout 10
set deviceconfig system ntp-servers primary-ntp-server 10.14.0.1
set deviceconfig system ntp-servers secondary-ntp-server 10.14.0.2
set shared log-settings syslog NTRO-SIEM server 10.14.5.50 port 514 facility LOG_LOCAL6
set shared authentication-profile RADIUS-AUTH method radius
set mgt-config users secadmin password $1$REDACTED_PASSWORD_HASH`
  },
  {
    id: 'sonic-whitebox-leaf',
    name: 'White-Box Leaf Switch (SONiC Network OS)',
    vendor: 'sonic_whitebox',
    vendorName: 'SONiC (Open Disaggregated Linux)',
    deviceType: 'White-Box',
    model: 'Edgecore AS7712-32X (Tomahawk)',
    serialNumber: '771232X1932004',
    osVersion: 'SONiC.202311.0-dirty_20240115',
    redactedSecretsCount: 2,
    rawText: `{
  "DEVICE_METADATA": {
    "localhost": {
      "hostname": "SONIC-LEAF-01",
      "platform": "x86_64-accton_as7712_32x-r0",
      "mac": "70:72:cf:89:12:00",
      "type": "LeafRouter"
    }
  },
  "SSH": {
    "global": {
      "protocol": "2",
      "idle_timeout": "600",
      "max_auth_tries": "3"
    }
  },
  "TELNET": {
    "global": {
      "status": "disabled"
    }
  },
  "SYSLOG_SERVER": {
    "10.14.5.50": {
      "port": "514",
      "facility": "local6",
      "severity": "informational"
    }
  },
  "NTP_SERVER": {
    "10.14.0.1": {
      "minpoll": "6",
      "maxpoll": "10"
    }
  },
  "BANNER": {
    "login": "RESTRICTED ACCESS - NTRO AI COMPUTE FABRIC"
  },
  "AAA": {
    "authentication": {
      "login": "tacacs+ local"
    }
  },
  "UNRECOGNIZED_VENDOR_BLOCK": {
    "vxlan_tunnel_keepalive": "30",
    "flow_telemetry_rate": "1000",
    "fast_reboot_watchdog": "enabled"
  }
}`
  },
  {
    id: 'fortinet-fortigate-60f',
    name: 'Fortinet FortiGate 60F Edge Appliance',
    vendor: 'fortinet_fortios',
    vendorName: 'Fortinet FortiOS',
    deviceType: 'Firewall',
    model: 'FG-60F',
    serialNumber: 'FGT60FTK21049281',
    osVersion: 'FortiOS v7.4.2 build2573',
    redactedSecretsCount: 3,
    rawText: `config system global
    set hostname "FGT-EDGE-BRANCH01"
    set admintimeout 10
    set admin-ssh-port 22
    set admin-telnet-service disable
    set admin-sport 8443
    set admin-http-service disable
    set post-login-banner enable
    set pre-login-banner enable
end
config system admin
    edit "secadmin"
        set trusthost1 10.14.10.0 255.255.255.0
        set accprofile "super_admin"
        set password ENC REDACTED_PASSWORD_HASH
    next
end
config log syslogd setting
    set status enable
    set server "10.14.5.50"
    set mode udp
    set port 514
    set facility local6
end
config system ntp
    set ntpsync enable
    set type custom
    config ntpserver
        edit 1
            set server "10.14.0.1"
        next
    end
end
config system snmp sysinfo
    set status enable
    set description "NTRO Edge Gateway"
end`
  },
  {
    id: 'arista-7050x-leaf',
    name: 'Arista 7050X Data Center Leaf Switch',
    vendor: 'arista_eos',
    vendorName: 'Arista EOS',
    deviceType: 'Switch',
    model: 'DCS-7050SX3-48YC8',
    serialNumber: 'JPE18240092',
    osVersion: 'EOS 4.30.2F',
    redactedSecretsCount: 2,
    rawText: `! Command: show running-config
! Device: ARISTA-LEAF-02 (DCS-7050SX3-48YC8, EOS-4.30.2F)
!
transceiver qsfp default-mode 4x10G
!
hostname ARISTA-LEAF-02
ip domain-name ntro.internal
!
banner login
GOVERNMENT CLASSIFIED NETWORK - ALL SESSIONS MONITORED
EOF
!
management ssh
   protocol version 2
   idle-timeout 10
   no shutdown
!
no management telnet
!
no management api http-commands
   no shutdown
!
aaa authentication login default local
aaa authorization exec default local
!
username netadmin privilege 15 secret sha512 $6$REDACTED_ADMIN_SECRET
!
logging host 10.14.5.50
logging level SECURITY informational
!
ntp server 10.14.0.1 prefer
ntp server 10.14.0.2
!
snmp-server community REDACTED_COMMUNITY ro
snmp-server group READGROUP v3 auth
snmp-server user secuser READGROUP v3 auth sha REDACTED_KEY
!
end`
  }
];
