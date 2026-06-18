import struct
import zlib

def chunk(ctype, data):
    c = ctype + data
    return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

def create_png(filename, size=32, r=249, g=115, b=22):
    # RGBA (color type 6)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    raw = b''
    for y in range(size):
        row = b'\x00'
        for x in range(size):
            cx, cy = x - size//2, y - size//2
            dist = (cx*cx + cy*cy) ** 0.5
            if dist <= size//2 - 2:
                row += bytes([r, g, b, 255])  # RGBA with full opacity
            else:
                row += bytes([20, 20, 20, 255])
        raw += row
    idat = zlib.compress(raw)
    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat))
        f.write(chunk(b'IEND', b''))

create_png('icons/icon.png', 512)
create_png('icons/32x32.png', 32)
create_png('icons/128x128.png', 128)
print('Icons created successfully')
