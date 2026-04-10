import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# tzShift: hours gained(+) or lost(-) due to timezone change
# tzFrom/tzTo: labels for display
tz_data = {
    'day:1,': {'shift': 1, 'from': 'EDT', 'to': 'CDT'},
    'day:2,': {'shift': 0, 'from': 'CDT', 'to': 'CDT'},
    'day:3,': {'shift': 1, 'from': 'CDT', 'to': 'MDT'},
    'day:4,': {'shift': 0, 'from': 'MDT', 'to': 'MDT'},
    'day:5,': {'shift': 0, 'from': 'MDT', 'to': 'MDT'},
    'day:6,': {'shift': 0, 'from': 'MDT', 'to': 'MDT'},
    'day:7,': {'shift': 0, 'from': 'MDT', 'to': 'MDT'},
    'day:8,': {'shift': 1, 'from': 'MDT', 'to': 'PDT'},
    'day:9,': {'shift': 0, 'from': 'PDT', 'to': 'PDT'},
    'day:10,': {'shift': 0, 'from': 'PDT', 'to': 'PDT'},
    'day:11,': {'shift': 0, 'from': 'PDT', 'to': 'PDT'},
    'day:12,': {'shift': 0, 'from': 'PDT', 'to': 'MST'},
    'day:13,': {'shift': 0, 'from': 'MST', 'to': 'MST'},
    'day:14,': {'shift': 0, 'from': 'MST', 'to': 'MST'},
    'day:15,': {'shift': -2, 'from': 'MST', 'to': 'CDT'},
    'day:16,': {'shift': -1, 'from': 'CDT', 'to': 'EDT'},
}

count = 0
for key, tz in tz_data.items():
    # Find: day:N, dow: and insert tzShift before dow
    day_num = key.replace('day:', '').replace(',', '')
    pattern = r'(day:' + day_num + r', dow:)'
    replacement = r'day:' + day_num + ',tzShift:' + str(tz['shift']) + ',tzFrom:"' + tz['from'] + '",tzTo:"' + tz['to'] + '", dow:'
    new_content = re.sub(pattern, replacement, content, count=1)
    if new_content != content:
        content = new_content
        count += 1
        print(f"+ Day {day_num}: {tz['from']} -> {tz['to']} ({tz['shift']:+d}h)")
    else:
        print(f"  SKIP: Day {day_num}")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nAdded timezone data to {count} days")
