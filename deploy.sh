#!/bin/bash

npm run build
aws s3 sync public s3://kmuncie-site-prd/shepherding/ --delete --profile kmuncie
aws cloudfront create-invalidation --distribution-id ENQKZZIYNE7H4 --paths "/shepherding/*" --profile kmuncie
aws cloudfront list-invalidations --distribution-id ENQKZZIYNE7H4 --profile kmuncie

