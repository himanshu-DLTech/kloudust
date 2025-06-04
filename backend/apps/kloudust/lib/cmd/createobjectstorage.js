/** 
 * createobjectstorage.js - Creates Object Storage Instancer from URI download or catalog image.
 * 
 * Params - 0 - VM name, 1 - VM description, 2 - cores, 3 - memory in MB, 4 vlan, 5 - disk in GB, 
 *  6 - image name,
 *  7 - vm user, 8 - vm password, 9 - storageadmin, 10 - storageadmin password, 11 - force overwrite if true
 *  in case the HOST has a VM by the same name already, it will be overwrittern, 12 - max cores
 *  is the maximum cores we can hotplug, 10 - max memory is the max memory we can hotplug, 
 *  11 - additional creation params (optional), 12 - vm type, default is vm, or anything else
 *  13 - No QEMU agent - "true" if no needed else "false", 14 - set to true to not install qemu-agent, 
 *  15 - hostname for the VM (only cloud admins can do this)
 * 
 * (C) 2020 TekMonks. All rights reserved.
 * License: See enclosed LICENSE file.
 */

const roleman = require(`${KLOUD_CONSTANTS.LIBDIR}/roleenforcer.js`);
const CMD_CONSTANTS = require(`${KLOUD_CONSTANTS.CMDDIR}/cmdconstants.js`);
const createVM = require(`${KLOUD_CONSTANTS.CMDDIR}/createVM.js`);

/**
 * Creates Object Storage Instance from URI download or catalog image
 * @param {array} params See documented params
 */
module.exports.exec = async function (params) {
    if (!roleman.checkAccess(roleman.ACTIONS.edit_project_resource)) {
        params.consoleHandlers.LOGUNAUTH(); return CMD_CONSTANTS.FALSE_RESULT();
    }

    const [vm_name_raw, vm_description, cores_s, memory_s, disk_s, vlan, creation_image_name, 
        vm_user, vm_password, storageadmin, storageadmin_password, force_overwrite, 
        hostname, ssl, sslKey, sslCert] = params;
    
    let runcmd_commands = [
        `[ sed, -i, 's/^MINIO_ROOT_USER=.*/MINIO_ROOT_USER=${storageadmin}/', /etc/default/minio ]`,
        `[ sed, -i, 's/^MINIO_ROOT_PASSWORD=.*/MINIO_ROOT_PASSWORD=${storageadmin_password}/', /etc/default/minio ]`,
    ];

    if (ssl === 'true' && sslKey && sslCert) {
        runcmd_commands.push(`[ sed, -i, 's|^MINIO_OPTS=.*|MINIO_OPTS="--console-address :9001 --certs-dir ${exports.STORAGE_CERTS_DIR}"|', /etc/default/minio ]`);
    } 
    runcmd_commands.push(`[ systemctl, start, ${exports.STORAGE_SERVICE}.service ]`);

    let cloudinit_data = `
system_info:
  default_user:
    name: ${vm_user}
    home: /home/${vm_user}
    sudo: 'ALL=(ALL) NOPASSWD:ALL'

password: ${vm_password}
chpasswd:
  expire: false

hostname: ${vm_name_raw}
ssh_pwauth: true
package_upgrade: false
packages:
  - net-tools

bootcmd:
  - [mkdir, -p, ${exports.STORAGE_CERTS_DIR}]
  - [chown, -R, ${exports.STORAGE_CERTS_DIR_OWNER}, ${exports.STORAGE_CERTS_DIR}]
  - [chmod, ${exports.STORAGE_CERTS_DIR_PERMISSIONS}, ${exports.STORAGE_CERTS_DIR}]

runcmd:
${runcmd_commands.map(cmd => `  - ${cmd}`).join('\n')}
`;

    if (ssl === 'true' && sslKey && sslCert) {  // Add write_files only if ssl is enabled
        cloudinit_data += `
write_files:
  - path: ${exports.STORAGE_CERTS_DIR}/private.key
    permissions: '${exports.STORAGE_CERTS_DIR_PERMISSIONS}'
    owner: ${exports.STORAGE_CERTS_DIR_OWNER}
    content: |
      ${sslKey.replace(/__NEWLINE__/g, '\n      ')}
  - path: ${exports.STORAGE_CERTS_DIR}/public.crt
    permissions: '${exports.STORAGE_CERTS_DIR_PERMISSIONS}'
    owner: ${exports.STORAGE_CERTS_DIR_OWNER}
    content: |
      ${sslCert.replace(/__NEWLINE__/g, '\n      ')}
`;
    }

    finalParams = [vm_name_raw, vm_description, cores_s, memory_s, disk_s, vlan, creation_image_name, cloudinit_data, 
        force_overwrite, cores_s, memory_s, "", exports.VM_TYPE_OBJECT_STORAGE, "false", hostname]
    finalParams.consoleHandlers = params.consoleHandlers;
    return await createVM.exec(finalParams);
};

exports.STORAGE_SERVICE = "kdstorage";
exports.VM_TYPE_OBJECT_STORAGE = "storage3";
exports.STORAGE_CERTS_DIR_OWNER = "root:root";
exports.STORAGE_CERTS_DIR_PERMISSIONS = "0755";
exports.STORAGE_CERTS_DIR = "/etc/minio/certs";
