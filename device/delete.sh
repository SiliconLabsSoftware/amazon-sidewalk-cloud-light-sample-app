#!/bin/bash

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