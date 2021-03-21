import Base, {LIGHT_TYPE_SPOT} from './base';

const h = require('../functions/helper');

export default class SpotLight extends Base {
    constructor(point, intensity, vector, cosThetaInner = 0.8, cosThetaOuter = 0.75) {
        super();
        this.type = LIGHT_TYPE_SPOT;
        this.ptX = point[0];
        this.ptY = point[1];
        this.ptZ = point[2];

        this.vecX = vector[0];
        this.vecY = vector[1];
        this.vecZ = vector[2];

        this.cosThetaInner = cosThetaInner;
        this.cosThetaOuter = cosThetaOuter;

        this.intensity = intensity;
    }

    toArray() {
        let base = super.toArray();
        let el = h.padArray([
            this.vecX,              // 10
            this.vecY,              // 11
            this.vecZ,              // 12
            this.cosThetaInner,     // 13
            this.cosThetaOuter      // 14
        ], 5, -1);
        return base.concat(el);
    }
}