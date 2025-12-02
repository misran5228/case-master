import { useTexture } from '@react-three/drei';

const [leatherColor, leatherNormal, leatherRoughness] = useTexture([
    "/models/leather_color.png",
    "/models/leather_normal.png",
    "/models/leather_roughness.png"
]);

// ...other code that uses leatherColor, leatherNormal, leatherRoughness
