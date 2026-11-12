from PIL import Image, ImageDraw

def create_icon(size):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Scale factor
    scale = size / 128.0
    pad = int(8 * scale)
    corner_radius = int(28 * scale)
    
    # Background rounded rect - purple gradient approximation / sleek brand color #5b50e6
    bg_color = (91, 80, 230, 255)
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=corner_radius, fill=bg_color)
    
    # Draw stacked layers (3 rhombuses/chevrons in perspective)
    center_x = size / 2.0
    
    # Layer 1 (Top layer)
    # Layer 2 (Middle layer)
    # Layer 3 (Bottom layer)
    # Perspective isometric diamond / stacked squares
    w = 54 * scale
    h = 24 * scale
    
    def draw_layer(cy, fill_color, border_color):
        points = [
            (center_x, cy - h/2),       # top
            (center_x + w/2, cy),       # right
            (center_x, cy + h/2),       # bottom
            (center_x - w/2, cy)        # left
        ]
        draw.polygon(points, fill=fill_color)
        if border_color:
            draw.polygon(points, outline=border_color, width=max(1, int(1.5 * scale)))

    # Bottom layer
    draw_layer(size * 0.68, (190, 195, 255, 230), (255, 255, 255, 255))
    # Middle layer
    draw_layer(size * 0.52, (225, 230, 255, 240), (255, 255, 255, 255))
    # Top layer
    draw_layer(size * 0.36, (255, 255, 255, 255), None)
    
    return img

for sz in [16, 32, 48, 128]:
    icon = create_icon(sz)
    icon.save(f'icons/icon{sz}.png', 'PNG')
    print(f'Generated icons/icon{sz}.png')

