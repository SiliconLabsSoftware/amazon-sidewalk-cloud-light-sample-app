#!/bin/bash

###############################################################################
# @file
# @brief Creates an AWS IoT thing, certificates, and device config for a named device.
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

if [ -e certs/$THING_NAME ]; then
  echo 'A device with this name already exists'
  exit 1
fi

source ../configure.sh


mkdir certs/$THING_NAME

cp ./device.sample.js certs/$THING_NAME/device.js
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/__thing_name__/$THING_NAME/g" certs/$THING_NAME/device.js
else
  sed -i "s/__thing_name__/$THING_NAME/g" certs/$THING_NAME/device.js
fi

AWS_IOT_ENDPOINT=`aws iot describe-endpoint --endpoint-type iot:Data-ATS | jq -r .endpointAddress`
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/__aws_iot_endpoint__/$AWS_IOT_ENDPOINT/g" certs/$THING_NAME/device.js
else
  sed -i "s/__aws_iot_endpoint__/$AWS_IOT_ENDPOINT/g" certs/$THING_NAME/device.js
fi

aws iot create-thing --thing-name ${THING_NAME} | tee certs/$THING_NAME/device.json

aws iot create-keys-and-certificate --certificate-pem-outfile certs/${THING_NAME}/certificate.pem.crt --public-key-outfile certs/${THING_NAME}/public.pem.key --private-key-outfile certs/${THING_NAME}/private.pem.key --set-as-active | tee certs/$THING_NAME/keys-and-certificate.json

CERT_ARN=$(jq -r '.certificateArn' < certs/$THING_NAME/keys-and-certificate.json)
aws iot attach-thing-principal --thing-name ${THING_NAME} --principal ${CERT_ARN}

aws iot attach-policy --policy-name CloudLightSoftDevice --target ${CERT_ARN}

# download the amazon root ca
if [ ! -e certs/$THING_NAME/AmazonRootCA1.pem ]; then
  curl -s https://www.amazontrust.com/repository/AmazonRootCA1.pem -o certs/$THING_NAME/AmazonRootCA1.pem
fi
