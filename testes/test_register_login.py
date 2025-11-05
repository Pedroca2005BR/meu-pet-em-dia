import os
import time
import random
from pathlib import Path
from e2e_store import record_user

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys


BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
PASSWORD = os.getenv('MEUPET_TEST_PWD', 'Senha@123A')
HEADLESS = os.getenv('MEUPET_HEADLESS', '1') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))


def make_driver(headless: bool = True):
    options = webdriver.ChromeOptions()
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--window-size=1366,900')
    return webdriver.Chrome(options=options)


def wait_click(driver, locator, timeout=15):
    el = WebDriverWait(driver, timeout).until(EC.element_to_be_clickable(locator))
    el.click()
    time.sleep(DELAY)
    return el


def wait_type(driver, locator, text, timeout=15):
    el = WebDriverWait(driver, timeout).until(EC.presence_of_element_located(locator))
    el.clear()
    el.send_keys(text)
    time.sleep(DELAY)
    return el


def create_dummy_file(name: str) -> str:
    p = Path(__file__).parent / name
    p.write_bytes(b'fake file for selenium upload tests')
    return str(p)


def random_cpf_masked() -> str:
    """Gera um CPF mascarado qualquer (11 dígitos, sem validação oficial)."""
    d = str(random.randint(10**10, 10**11 - 1))  # garante 11 dígitos
    return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:11]}"


def random_phone_masked() -> str:
    """Gera um celular no formato (00) 00000-0000."""
    ddd = random.randint(11, 99)
    p1 = random.randint(10000, 99999)
    p2 = random.randint(1000, 9999)
    return f"({ddd}) {p1}-{p2}"


def register_tutor(driver, name: str, email: str, cpf: str, phone: str):
    driver.get(f"{BASE_URL}/register")
    # Tutor já é o valor padrão; não clicar evita falsos negativos por XPath frágil
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//h1[normalize-space()='Criar Conta']")))

    wait_type(driver, (By.XPATH, "//input[@placeholder='Seu nome completo']"), name)
    wait_type(driver, (By.XPATH, "//input[@placeholder='000.000.000-00']"), cpf)
    wait_type(driver, (By.XPATH, "//input[@placeholder='seu@email.com']"), email)
    wait_type(driver, (By.XPATH, "//input[@placeholder='(00) 00000-0000']"), phone)
    wait_type(driver, (By.XPATH, "//input[@placeholder='8 a 12 caracteres']"), PASSWORD)
    wait_type(driver, (By.XPATH, "//input[@placeholder='Repita a senha']"), PASSWORD)

    wait_click(driver, (By.XPATH, "//button[normalize-space()='Criar Conta']"))
    WebDriverWait(driver, 20).until(EC.url_matches(r".*/$"))
    record_user(email=email, password=PASSWORD, user_type='Tutor', name=name)


def register_vet(driver, name: str, email: str, cpf: str, phone: str):
    driver.get(f"{BASE_URL}/register")
    WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//h1[normalize-space()='Criar Conta']")))
    # Selecionar Veterinário
    wait_click(driver, (By.XPATH, "//div[normalize-space()='Veterinário']"))

    wait_type(driver, (By.XPATH, "//input[@placeholder='Seu nome completo']"), name)
    wait_type(driver, (By.XPATH, "//input[@placeholder='000.000.000-00']"), cpf)
    wait_type(driver, (By.XPATH, "//input[@placeholder='seu@email.com']"), email)
    wait_type(driver, (By.XPATH, "//input[@placeholder='(00) 00000-0000']"), phone)
    wait_type(driver, (By.XPATH, "//input[@placeholder='8 a 12 caracteres']"), PASSWORD)
    wait_type(driver, (By.XPATH, "//input[@placeholder='Repita a senha']"), PASSWORD)

    # Campos específicos do vet
    wait_type(driver, (By.XPATH, "//input[@placeholder='Número do CRMV']"), "CRMV-SP 12345")
    # uploads
    doc1 = create_dummy_file('prof_doc.pdf')
    doc2 = create_dummy_file('diploma.pdf')
    file_inputs = driver.find_elements(By.XPATH, "//input[@type='file']")
    file_inputs[0].send_keys(doc1)
    file_inputs[1].send_keys(doc2)

    wait_click(driver, (By.XPATH, "//button[normalize-space()='Criar Conta']"))
    WebDriverWait(driver, 20).until(EC.url_matches(r".*/$"))
    record_user(email=email, password=PASSWORD, user_type='Veterinário', name=name)


def logout(driver):
    # Tenta fechar qualquer modal sobreposto
    try:
        body = driver.find_element(By.TAG_NAME, 'body')
        body.send_keys(Keys.ESCAPE)
        body.send_keys(Keys.ESCAPE)
    except Exception:
        pass

    try:
        # abrir dropdown do avatar (div circular com gradiente)
        avatar = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//div[contains(@style,'linear-gradient') and contains(@style,'border-radius')]"))
        )
        driver.execute_script("arguments[0].click()", avatar)

        # clicar em Sair (texto dentro do item)
        sair = WebDriverWait(driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//div[contains(@style,'cursor') or @onclick or @role]//div[contains(normalize-space(), 'Sair')] | //div[contains(normalize-space(), 'Sair')]"))
        )
        driver.execute_script("arguments[0].click()", sair)
        WebDriverWait(driver, 10).until(EC.url_contains('/login'))
        return
    except Exception:
        # Fallback robusto: limpar token e ir para /login
        driver.execute_script("localStorage.removeItem('token');")
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(EC.url_contains('/login'))


def login(driver, email: str):
    driver.get(f"{BASE_URL}/login")
    wait_type(driver, (By.XPATH, "//input[@type='email']"), email)
    wait_type(driver, (By.XPATH, "//input[@type='password']"), PASSWORD)
    wait_click(driver, (By.XPATH, "//button[normalize-space()='Entrar']"))
    WebDriverWait(driver, 20).until(EC.url_matches(r".*/$"))


def main():
    driver = make_driver(headless=HEADLESS)
    driver.implicitly_wait(2)
    emails = []
    try:
      # 3 tutores
      for i in range(3):
          email = f"tutor{i+1}-{int(time.time())}-{random.randint(1000,9999)}@mailinator.com"
          cpf = random_cpf_masked()
          phone = random_phone_masked()
          register_tutor(driver, name=f"Tutor {i+1}", email=email, cpf=cpf, phone=phone)
          emails.append(email)
          logout(driver)

      # 2 veterinários
      for i in range(2):
          email = f"vet{i+1}-{int(time.time())}-{random.randint(1000,9999)}@mailinator.com"
          cpf = random_cpf_masked()
          phone = random_phone_masked()
          register_vet(driver, name=f"Vet {i+1}", email=email, cpf=cpf, phone=phone)
          emails.append(email)
          logout(driver)

      # login/logout ciclando nas contas
      for e in emails:
          login(driver, e)
          logout(driver)

      print('E2E OK: Registro e login/logout concluídos para', len(emails), 'contas')
    finally:
      driver.quit()


if __name__ == '__main__':
    main()


