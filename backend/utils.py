import math

numberWord0To9 = {
    0: "nul",
    1: "jedyn",
    2: "dwaj",
    3: "tři",
    4: "štyri",
    5: "pjeć",
    6: "šěsć",
    7: "sydom",
    8: "wosom",
    9: "dźewjeć",
}

numberWord10To19 = {
    10: "dźesać",
    11: "jědnaće",
    12: "dwanaće",
    13: "třinaće",
    14: "štyrnaće",
    15: "pjatnaće",
    16: "šěsnaće",
    17: "sydomnaće",
    18: "wosomnaće",
    19: "dźewjatnaće",
}

numberWord20To90 = {
    2: "dwaceći",
    3: "třiceći",
    4: "štyrceći",
    5: "pjećdźesat",
    6: "šěsćdźesat",
    7: "sydomdźesat",
    8: "wosomdźesat",
    9: "dźewjećdźesat",
}

numberWord100To900 = {
    1: "sto",
    2: "dwěsćě",
    3: "třista",
    4: "štyrista",
    5: "pjećstow",
    6: "šěsćstow",
    7: "sydomstow",
    8: "wosomstow",
    9: "dźewjećstow",
}

numberWord1000plus = {
    1e3: "tysac",
    1e6: "jedyn milion",  # milion maskulinum
    2e6: "dwaj milionaj",
    3e6: "tři miliony",
    4e6: "štyri miliony",
    5e6: "pjeć milionow",
    "6e6+": "milionow",
    1e9: "jedna miliarda",  # miliarda femininum
    2e9: "dwě miliardźe",
    3e9: "tři miliardy",
    4e9: "štyri miliardy",
    5e9: "pjeć miliardow",
    "6e9+": "miliardow",
    1e12: "jedyn bilion",  # bilion maskulinum
    2e12: "dwaj bilionaj",
    3e12: "tři biliony",
    4e12: "štyri biliony",
    5e12: "pjeć bilionow",
    "6e12+": "bilionow",
}


def spellNumber0to99(num):
    if num < 0 and num > 100:
        raise ValueError("number out of range!")

    if num < 10:
        return numberWord0To9[num]
    elif num >= 10 and num < 20:
        return numberWord10To19[num]
    elif num >= 20 and num < 100:
        num1 = math.floor(num / 10)
        num2 = num % 10
        if num2 == 0:
            return numberWord20To90[num1]
        else:
            return f"{numberWord0To9[num2]} a {numberWord20To90[num1]}"


def spellNumber100to999(num):
    if num < 100 and num > 1000:
        raise ValueError("number out of range!")

    num1 = math.floor(num / 100)
    num2 = num % 100

    if num2 == 0:
        return f"{numberWord100To900[num1]}"
    else:
        return f"{numberWord100To900[num1]} {spellNumber0to99(num2)}"


def spellNumber0to999(num):

    if num >= 0 and num < 100:
        return spellNumber0to99(num)
    elif num >= 100 and num < 1000:
        return spellNumber100to999(num)
    return ValueError("number out of range!")


def spellNumber1000to999999(num):

    texts = []

    num1 = math.floor(num / 1e3)
    num2 = num % 1e3

    if num1 > 0:
        if num != 1:
            texts.append(spellNumber0to999(num1))
        texts.append(numberWord1000plus[1e3])
    if num2 > 0:
        texts.append(spellNumber0to999(num2))
    return " ".join(texts)


def spellNumberMil(num):
    texts = []
    num1 = math.floor(num / 1e6)
    num2 = num % 1e6

    if num1 > 0:
        if num1 == 1:
            texts.append(numberWord1000plus[1e6])
        elif num1 == 2:
            texts.append(numberWord1000plus[2e6])
        elif num1 == 3:
            texts.append(numberWord1000plus[3e6])
        elif num1 == 4:
            texts.append(numberWord1000plus[4e6])
        elif num1 == 5:
            texts.append(numberWord1000plus[5e6])
        else:
            texts.append(spellNumber0to999(num1))
            texts.append(numberWord1000plus["6e6+"])

    if num2 > 0:
        texts.append(spellNumber1000to999999(num2))
    return " ".join(texts)


def spellNumberMrd(num):
    texts = []
    num1 = math.floor(num / 1e9)
    num2 = num % 1e9

    if num1 > 0:
        if num1 == 1:
            texts.append(numberWord1000plus[1e9])
        elif num1 == 2:
            texts.append(numberWord1000plus[2e9])
        elif num1 == 3:
            texts.append(numberWord1000plus[3e9])
        elif num1 == 4:
            texts.append(numberWord1000plus[4e9])
        elif num1 == 5:
            texts.append(numberWord1000plus[5e9])
        else:
            texts.append(spellNumber0to999(num1))
            texts.append(numberWord1000plus["6e9+"])

    if num2 > 0:
        texts.append(spellNumberMil(num2))
    return " ".join(texts)


def spellNumberBil(num):
    texts = []
    num1 = math.floor(num / 1e12)
    num2 = num % 1e12

    if num1 > 0:
        if num1 == 1:
            texts.append(numberWord1000plus[1e12])
        elif num1 == 2:
            texts.append(numberWord1000plus[2e12])
        elif num1 == 3:
            texts.append(numberWord1000plus[3e12])
        elif num1 == 4:
            texts.append(numberWord1000plus[4e12])
        elif num1 == 5:
            texts.append(numberWord1000plus[5e12])
        else:
            texts.append(spellNumber0to999(num1))
            texts.append(numberWord1000plus["6e12+"])

    if num2 > 0:
        texts.append(spellNumberMrd(num2))
    return " ".join(texts)


def year_to_text(num):
    num = int(num)
    if num > 1099 and num < 2000:
        num1 = math.floor(num / 100)
        num1_txt = spellNumber0to99(num1)
        num2 = num % 100
        num2_txt = spellNumber0to99(num2)
        return f"{num1_txt} stow {num2_txt}"
    else:
        return number_to_text(num)


def number_to_text(num):

    try:
        int(num)
    except ValueError:
        raise ValueError("not a number!")

    num = int(num)

    if num >= 0 and num < 1000:
        return spellNumber0to999(num)
    elif num >= 1e3 and num < 1e6:
        return spellNumber1000to999999(num)
    elif num >= 1e6 and num < 1e9:
        return spellNumberMil(num)
    elif num >= 1e9 and num < 1e12:
        return spellNumberMrd(num)
    elif num >= 1e12 and num < 1e15:
        return spellNumberBil(num)
    else:
        raise ValueError("number out of range!")
