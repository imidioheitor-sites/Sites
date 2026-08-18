import numpy as np, sys, wave

SR = 44100

def adsr(n, a, d, s, r):
    a,d,r = int(a*SR), int(d*SR), int(r*SR)
    sus = max(0, n-a-d-r)
    return np.concatenate([
        np.linspace(0,1,a,endpoint=False) if a else np.array([]),
        np.linspace(1,s,d,endpoint=False) if d else np.array([]),
        np.full(sus, s),
        np.linspace(s,0,r) if r else np.array([]),
    ])[:n]

def osc(f, n, kind="saw", detune=0.0):
    t = np.arange(n)/SR
    ph = 2*np.pi*f*(1+detune)*t
    if kind=="sine": return np.sin(ph)
    if kind=="tri":  return 2/np.pi*np.arcsin(np.sin(ph))
    if kind=="sqr":  return np.sign(np.sin(ph))*0.6
    # saw suave: soma de harmônicos limitada (evita aliasing áspero)
    y = np.zeros(n)
    for k in range(1, 13):
        if f*k > SR/2.2: break
        y += np.sin(ph*k)/k
    return y*(2/np.pi)

def lowpass(x, cut, res=0.0):
    # um polo simples encadeado — suave, sem ressonância agressiva
    a = np.exp(-2*np.pi*cut/SR)
    y = np.zeros_like(x); z = 0.0
    for i in range(len(x)):
        z = (1-a)*x[i] + a*z
        y[i] = z
    return y

def note(f, dur, kind="saw", env=(0.01,0.12,0.6,0.25), cut=2600, detune=0.006, amp=0.3):
    n = int(dur*SR)
    y = osc(f,n,kind) + (osc(f,n,kind,detune) + osc(f,n,kind,-detune))*0.5
    y = y/2.0
    y = lowpass(y, cut)
    return y*adsr(n,*env)*amp

def kick(dur=0.5, amp=0.9):
    n=int(dur*SR); t=np.arange(n)/SR
    f = 120*np.exp(-t*22)+45
    y = np.sin(2*np.pi*np.cumsum(f)/SR)
    y *= np.exp(-t*7)
    y += np.random.randn(n)*np.exp(-t*90)*0.08   # click
    return np.tanh(y*1.6)*amp

def hat(dur=0.07, amp=0.18):
    n=int(dur*SR); t=np.arange(n)/SR
    y = np.random.randn(n)*np.exp(-t*70)
    # passa-alta rústico
    y = y - lowpass(y, 3000)
    return y*amp

def clap(dur=0.22, amp=0.3):
    n=int(dur*SR); t=np.arange(n)/SR
    y = np.random.randn(n)*np.exp(-t*22)
    y = y - lowpass(y, 900)
    return y*amp

def reverb(x, decay=2.0, mix=0.28):
    # Schroeder simplificado: alguns combs + allpass
    out = np.copy(x)
    for d,g in [(1237,0.78),(1601,0.74),(1867,0.70),(2053,0.66)]:
        b = np.zeros(len(x)+d)
        b[:len(x)] = x
        for i in range(len(x)):
            b[i+d] += b[i]*g*np.exp(-1.0/decay)
        out += b[:len(x)]*0.22
    return (1-mix)*x + mix*(out/2.2)

NOTES = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
def hz(name, octv=4):
    return 440.0*2**((NOTES[name]+(octv-4)*12-9)/12)

def build(track, seconds, bpm, prog, moods):
    beat = 60/bpm
    total = int(seconds*SR)
    L = np.zeros(total); R = np.zeros(total)
    def put(buf, sig, at):
        i=int(at*SR); j=min(len(buf), i+len(sig))
        if i<len(buf): buf[i:j] += sig[:j-i]

    bars = int(seconds/(beat*4))
    for bar in range(bars):
        t0 = bar*beat*4
        chord = prog[bar % len(prog)]
        root, octv, tones = chord
        # pad
        for k,semi in enumerate(tones):
            f = hz(root,octv)*2**(semi/12)
            s = note(f, beat*4*1.02, "saw", (0.9,0.6,0.75,1.1), moods['padcut'], 0.008, moods['pad'])
            put(L, s*0.95, t0); put(R, s, t0+0.012)
        # baixo
        fb = hz(root, octv-2)
        for b in range(4):
            if moods['bassEvery'] == 1 or b % 2 == 0:
                s = note(fb, beat*0.9, "sine", (0.005,0.10,0.55,0.25), 500, 0.0, moods['bass'])
                put(L,s,t0+b*beat); put(R,s,t0+b*beat)
        # arpejo / pluck
        arp = [tones[i%len(tones)] for i in range(8)]
        for i,semi in enumerate(arp):
            f = hz(root,octv+1)*2**(semi/12)
            st = t0 + i*(beat/2)
            s = note(f, beat*0.55, moods['plkwave'], (0.004,0.16,0.25,0.20), moods['plkcut'], 0.004, moods['pluck'])
            put(L, s*(1.0 if i%2 else 0.8), st)
            put(R, s*(0.8 if i%2 else 1.0), st+0.008)
        # arranjo: quebra de dois compassos a ~60% para a trilha respirar
        brk = int(bars*0.60)
        quebra = brk <= bar < brk+2
        if quebra:
            continue
        # percussão
        if bar >= moods['drumsFrom']:
            for b in range(4):
                put(L, kick(0.45, moods['kick']), t0+b*beat); put(R, kick(0.45, moods['kick']), t0+b*beat)
            for h in range(8):
                if moods['hats']:
                    a = moods['hats']*(0.7 if h%2 else 1.0)
                    put(L, hat(0.06,a*0.9), t0+h*(beat/2)); put(R, hat(0.06,a), t0+h*(beat/2)+0.004)
            if moods['clap']:
                for b in (1,3):
                    put(L, clap(0.2,moods['clap']), t0+b*beat); put(R, clap(0.2,moods['clap']), t0+b*beat)

    # espaço e brilho
    L = reverb(L, 1.8, moods['verb']); R = reverb(R, 2.0, moods['verb'])
    # entrada e saída
    fi = int(2.2*SR); fo = int(4.0*SR)
    for buf in (L,R):
        buf[:fi] *= np.linspace(0,1,fi)
        buf[-fo:] *= np.linspace(1,0,fo)
    # normaliza com teto
    m = max(np.abs(L).max(), np.abs(R).max()) or 1
    L = np.tanh(L/m*1.15)*0.92; R = np.tanh(R/m*1.15)*0.92
    st = np.stack([L,R],axis=1)
    pcm = (st*32767).astype(np.int16)
    with wave.open(track,'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("gerado", track, f"{seconds}s {bpm}bpm")

# ── três leitos, um por vídeo ───────────────────────────────────────
maj=[0,4,7,11]; min7=[0,3,7,10]; sus=[0,5,7,12]

if sys.argv[1]=="1":   # percurso — caloroso e tranquilo
    build("mus1.wav", 95, 82,
      [('D',3,maj),('B',2,min7),('G',3,maj),('A',3,sus)],
      dict(pad=.20,bass=.30,pluck=.16,padcut=1500,plkcut=2600,plkwave="tri",
           kick=.30,hats=.05,clap=0,drumsFrom=4,bassEvery=2,verb=.34))
elif sys.argv[1]=="2": # interações — moderno e focado
    build("mus2.wav", 92, 100,
      [('A',3,min7),('F',3,maj),('C',3,maj),('G',3,sus)],
      dict(pad=.16,bass=.32,pluck=.20,padcut=1700,plkcut=3400,plkwave="tri",
           kick=.36,hats=.09,clap=.10,drumsFrom=2,bassEvery=1,verb=.26))
else:                  # ritmo — energético
    build("mus3.wav", 80, 120,
      [('E',3,maj),('C#',3,min7),('A',3,maj),('B',3,sus)],
      dict(pad=.14,bass=.34,pluck=.22,padcut=2000,plkcut=3100,plkwave="tri",
           kick=.42,hats=.08,clap=.12,drumsFrom=1,bassEvery=1,verb=.20))
