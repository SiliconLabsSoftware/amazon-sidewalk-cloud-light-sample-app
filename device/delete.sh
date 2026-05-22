#!/bin/bash

###############################################################################
# @file
# @brief Deletes an AWS IoT thing, revokes its certificate, and removes local device files.
###############################################################################
# # License
# Copyright 2026 Silicon Laboratories Inc. www.silabs.com
###############################################################################
#
# SPDX-License-Identifier: Zlib
#
# The licensor of this software is Silicon Laboratories Inc.
#
# This software is provided 'as-is', without any express or implied
# warranty. In no event will the authors be held liable for any damages
# arising from the use of this software.
#
# Permission is granted to anyone to use this software for any purpose,
# including commercial applications, and to alter it and redistribute it
# freely, subject to the following restrictions:
#
# 1. The origin of this software must not be misrepresented; you must not
#    claim that you wrote the original software. If you use this software
#    in a product, an acknowledgment in the product documentation would be
#    appreciated but is not required.
# 2. Altered source versions must be plainly marked as such, and must not be
#    misrepresented as being the original software.
# 3. This notice may not be removed or altered from any source distribution.
#
###############################################################################

if [[ -z "$1" ]]; then
  echo "Provide thing name as argument" 1>&2
  echo "$0 <thing-name>"
  exit 1
fi

THING_NAME=$1

source ../configure.sh


CERT_ARN=$(jq -r '.certificateArn' < certs/$THING_NAME/keys-and-certificate.json)

aws iot detach-policy --policy-name CloudLightSoftDevice --target ${CERT_ARN}

aws iot detach-thing-principal --thing-name ${THING_NAME} --principal ${CERT_ARN}

aws iot update-certificate --certificate-id $(jq -r '.certificateId' < certs/$THING_NAME/keys-and-certificate.json) --new-status INACTIVE

aws iot delete-certificate --certificate-id $(jq -r '.certificateId' < certs/$THING_NAME/keys-and-certificate.json)

aws iot delete-thing --thing-name ${THING_NAME}

rm certs/${THING_NAME}/certificate.pem.crt certs/${THING_NAME}/public.pem.key certs/${THING_NAME}/private.pem.key certs/${THING_NAME}/keys-and-certificate.json certs/${THING_NAME}/device.json certs/${THING_NAME}/device.js certs/$THING_NAME/AmazonRootCA1.pem
rmdir certs/${THING_NAME}