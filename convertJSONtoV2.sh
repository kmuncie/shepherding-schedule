#!/bin/bash

# Script: convertJSONtoV2.sh
# Author: Kevin Muncie
# Date: Oct 26, 2023
# Description: This script converts the JSON structure of a Shepherding Schedule program
# initial v1 JSON format to V2.  It adds new fields 'completedDate' and
# 'mostRecentMeeting' to each meeting item.
# Usage:
#   - Place this script in the same directory as your input JSON file.
#   - Make the script executable: chmod +x convert_json.sh
#   - Run the script: ./convert_json.sh <input_file.json>
# Example:
#   ./convert_json.sh original_data.json
#   Output will be saved in original_datav2.json

# Check for input file argument
if [ -z "$1" ]; then
   echo "Usage: $0 <input_file.json>"
   exit 1
fi

# Check if file exists
if [ ! -f "$1" ]; then
   echo "File '$1' not found."
   exit 1
fi

# Read the original data from the input JSON file
original_data=$(cat "$1")

# Generate output file name
output_file="${1%.json}v2.json"

# Initialize new data arrays for shepherds and sheep
shepherds_data="[]"
sheep_data="[]"

# Loop through each item in the original data array
echo "$original_data" | jq -c '.[]' | while read -r item; do
   # Extract fields
   id=$(echo "$item" | jq -r '.id')
   name=$(echo "$item" | jq -r '.name')
   location=$(echo "$item" | jq -r '.location')
   role=$(echo "$item" | jq -r '.role')
   meetings=$(echo "$item" | jq -c '.meetings')

   # Update meetings to include 'completedDate'
   new_meetings=$(echo "$meetings" | jq 'map(if .completed == true then . + {"completedDate": "2023-09-30"} else . + {"completedDate": null} end)')

   # Find the most recently completed meeting
   most_recent_meeting=$(echo "$new_meetings" | jq -s 'sort_by(-.year, -.quarter) | .[0]' || echo "null")

   # Create new item
   new_item=$(jq -n \
                 --arg id "$id" \
                 --arg name "$name" \
                 --arg location "$location" \
                 --argjson most_recent_meeting "$most_recent_meeting" \
                 --argjson meetings "$new_meetings" \
                 '{id: $id, name: $name, location: $location, mostRecentMeeting: $most_recent_meeting, meetings: $meetings}')

   # Add to the appropriate role list
   if [ "$role" == "shepherd" ]; then
      shepherds_data=$(echo "$shepherds_data" | jq ". + [$new_item]")
   else
      sheep_data=$(echo "$sheep_data" | jq ". + [$new_item]")
   fi
done

# Combine shepherds and sheep into new data
new_data=$(jq -n \
              --argjson shepherds "$shepherds_data" \
              --argjson sheep "$sheep_data" \
              '{shepherds: $shepherds, sheep: $sheep}')

# Output the new data to the output file
echo "$new_data" > "$output_file"

echo "Conversion complete. New data saved to '$output_file'"

