export const Parser = {
    parseOsu(text) {
        const lines = text.split(/\r?\n/);
        const map = {
            General: {},
            Editor: {},
            Metadata: {},
            Difficulty: { 
                ApproachRate: 5, 
                CircleSize: 5, 
                OverallDifficulty: 5, 
                HPDrainRate: 5,
                SliderMultiplier: 1.4,
                SliderTickRate: 1
            },
            Events: [],
            TimingPoints: [],
            Colours: [],
            HitObjects: []
        };
        
        let section = "";
        
        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('//')) continue;
            
            if (line.startsWith('[') && line.endsWith(']')) {
                section = line.slice(1, -1);
                continue;
            }
            
            switch (section) {
                case "General":
                case "Editor":
                case "Metadata":
                    this._parseKeyValue(line, map[section]);
                    break;
                    
                case "Difficulty":
                    this._parseDifficulty(line, map.Difficulty);
                    break;
                    
                case "Events":
                    map.Events.push(line);
                    break;
                    
                case "TimingPoints":
                    this._parseTimingPoint(line, map.TimingPoints);
                    break;
                    
                case "Colours":
                    this._parseKeyValue(line, map.Colours);
                    break;
                    
                case "HitObjects":
                    this._parseHitObject(line, map.HitObjects);
                    break;
            }
        }
        
        return map;
    },
    
    _parseKeyValue(line, target) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;
        
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        target[key] = value;
    },
    
    _parseDifficulty(line, difficulty) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) return;
        
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        const numValue = parseFloat(value);
        
        const keyMap = {
            'ApproachRate': 'ApproachRate',
            'AR': 'ApproachRate',
            'CircleSize': 'CircleSize',
            'CS': 'CircleSize',
            'OverallDifficulty': 'OverallDifficulty',
            'OD': 'OverallDifficulty',
            'HPDrainRate': 'HPDrainRate',
            'HP': 'HPDrainRate',
            'SliderMultiplier': 'SliderMultiplier',
            'SliderTickRate': 'SliderTickRate'
        };
        
        const mappedKey = keyMap[key];
        if (mappedKey && !isNaN(numValue)) {
            difficulty[mappedKey] = numValue;
        }
    },
    
    _parseTimingPoint(line, timingPoints) {
        const parts = line.split(',');
        if (parts.length < 2) return;
        
        const point = {
            time: parseFloat(parts[0]),
            beatLength: parseFloat(parts[1]),
            meter: parts[2] ? parseInt(parts[2]) : 4,
            sampleSet: parts[3] ? parseInt(parts[3]) : 0,
            sampleIndex: parts[4] ? parseInt(parts[4]) : 0,
            volume: parts[5] ? parseInt(parts[5]) : 100,
            uninherited: parts[6] ? parseInt(parts[6]) === 1 : true,
            effects: parts[7] ? parseInt(parts[7]) : 0
        };
        
        timingPoints.push(point);
    },
    
    _parseHitObject(line, hitObjects) {
        const parts = line.split(',');
        if (parts.length < 4) return;
        
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        const time = parseFloat(parts[2]);
        const type = parseInt(parts[3]);
        const hitSound = parts[4] ? parseInt(parts[4]) : 0;
        
        const obj = {
            x,
            y,
            time,
            type,
            hitSound,
            hit: false,
            spawned: false
        };
        
        if (type & 1) {
            obj.typeStr = "circle";
            obj.hitSample = parts[5] || "0:0:0:0:";
            
        } else if (type & 2) {
            obj.typeStr = "slider";
            obj.curveType = '';
            obj.curvePoints = [];
            obj.slides = 1;
            obj.length = 0;
            obj.edgeSounds = [];
            obj.edgeSets = [];
            obj.hitSample = "0:0:0:0:";
            
            if (parts.length >= 6) {
                const curveData = parts[5].split('|');
                obj.curveType = curveData[0];
                
                for (let i = 1; i < curveData.length; i++) {
                    const coords = curveData[i].split(':');
                    if (coords.length >= 2) {
                        obj.curvePoints.push({
                            x: parseFloat(coords[0]),
                            y: parseFloat(coords[1])
                        });
                    }
                }
            }
            
            if (parts.length >= 7) obj.slides = parseInt(parts[6]);
            if (parts.length >= 8) obj.length = parseFloat(parts[7]);
            if (parts.length >= 9) obj.edgeSounds = parts[8].split('|').map(s => parseInt(s));
            if (parts.length >= 10) obj.edgeSets = parts[9].split('|');
            if (parts.length >= 11) obj.hitSample = parts[10];
            
        } else if (type & 8) {
            obj.typeStr = "spinner";
            obj.endTime = parts[5] ? parseFloat(parts[5]) : time + 1000;
            obj.hitSample = parts[6] || "0:0:0:0:";
            
        } else if (type & 128) {
            obj.typeStr = "hold";
            const endTimeData = parts[5] ? parts[5].split(':') : [time + 1000];
            obj.endTime = parseFloat(endTimeData[0]);
            obj.hitSample = parts[6] || "0:0:0:0:";
        }
        
        obj.newCombo = !!(type & 4);
        obj.comboSkip = (type >> 4) & 7;
        
        hitObjects.push(obj);
    },
    
    async parseReplay(buffer) {
        try {
            const view = new DataView(buffer);
            let offset = 0;
            
            const replay = {
                mode: 0,
                version: 0,
                beatmapHash: '',
                playerName: '',
                replayHash: '',
                count300: 0,
                count100: 0,
                count50: 0,
                countGeki: 0,
                countKatu: 0,
                countMiss: 0,
                score: 0,
                maxCombo: 0,
                perfectCombo: false,
                mods: 0,
                lifebarGraph: '',
                timestamp: 0,
                replayData: []
            };
            
            replay.mode = view.getUint8(offset);
            offset += 1;
            
            replay.version = view.getInt32(offset, true);
            offset += 4;
            
            const beatmapHashResult = this._readOsuString(view, offset);
            replay.beatmapHash = beatmapHashResult.value;
            offset = beatmapHashResult.offset;
            
            const playerNameResult = this._readOsuString(view, offset);
            replay.playerName = playerNameResult.value;
            offset = playerNameResult.offset;
            
            const replayHashResult = this._readOsuString(view, offset);
            replay.replayHash = replayHashResult.value;
            offset = replayHashResult.offset;
            
            replay.count300 = view.getUint16(offset, true); offset += 2;
            replay.count100 = view.getUint16(offset, true); offset += 2;
            replay.count50 = view.getUint16(offset, true); offset += 2;
            replay.countGeki = view.getUint16(offset, true); offset += 2;
            replay.countKatu = view.getUint16(offset, true); offset += 2;
            replay.countMiss = view.getUint16(offset, true); offset += 2;
            
            replay.score = view.getInt32(offset, true);
            offset += 4;
            
            replay.maxCombo = view.getUint16(offset, true);
            offset += 2;
            
            replay.perfectCombo = view.getUint8(offset) === 1;
            offset += 1;
            
            replay.mods = view.getInt32(offset, true);
            offset += 4;
            
            const lifebarResult = this._readOsuString(view, offset);
            replay.lifebarGraph = lifebarResult.value;
            offset = lifebarResult.offset;
            
            const ticksLow = view.getUint32(offset, true);
            const ticksHigh = view.getUint32(offset + 4, true);
            replay.timestamp = (ticksHigh * 4294967296 + ticksLow);
            offset += 8;
            
            const replayLength = view.getInt32(offset, true);
            offset += 4;
            
            if (replayLength > 0) {
                const compressedData = new Uint8Array(buffer, offset, replayLength);
                replay.compressedReplayData = compressedData;
                replay.replayDataLength = replayLength;
                offset += replayLength;
            }
            
            if (offset + 8 <= buffer.byteLength) {
                const scoreLow = view.getUint32(offset, true);
                const scoreHigh = view.getUint32(offset + 4, true);
                replay.onlineScoreId = (scoreHigh * 4294967296 + scoreLow);
                offset += 8;
            }
            
            return replay;
            
        } catch (error) {
            console.error('Error parsing replay:', error);
            throw new Error(`Replay parsing failed: ${error.message}`);
        }
    },
    
    _readOsuString(view, offset) {
        const indicator = view.getUint8(offset);
        offset += 1;
        
        if (indicator === 0x00) {
            return { value: '', offset };
        } else if (indicator === 0x0b) {
            let length = 0;
            let shift = 0;
            
            while (true) {
                const byte = view.getUint8(offset);
                offset += 1;
                
                length |= (byte & 0x7f) << shift;
                
                if ((byte & 0x80) === 0) break;
                shift += 7;
            }
            
            const bytes = new Uint8Array(view.buffer, offset, length);
            const value = new TextDecoder('utf-8').decode(bytes);
            offset += length;
            
            return { value, offset };
        }
        
        return { value: '', offset };
    }
};
