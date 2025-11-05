import os
import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.alert import Alert
from e2e_store import get_last_tutors

BASE_URL = os.getenv('MEUPET_BASE_URL', 'http://localhost:5173')
HEADLESS = os.getenv('MEUPET_HEADLESS', '1') != '0'
DELAY = float(os.getenv('MEUPET_E2E_DELAY', '0.5'))


def make_driver(headless: bool = True):
  options = webdriver.ChromeOptions()
  if headless:
    options.add_argument('--headless=new')
  options.add_argument('--window-size=1366,900')
  return webdriver.Chrome(options=options)


def wait_click(drv, locator, timeout=15):
  el = WebDriverWait(drv, timeout).until(EC.element_to_be_clickable(locator))
  el.click()
  time.sleep(DELAY)
  return el


def wait_type(drv, locator, text, timeout=15):
  el = WebDriverWait(drv, timeout).until(EC.presence_of_element_located(locator))
  el.clear()
  el.send_keys(text)
  time.sleep(DELAY)
  return el


def login(drv, email: str, password: str):
  drv.get(f"{BASE_URL}/login")
  wait_type(drv, (By.CSS_SELECTOR, "input[type='email']"), email)
  wait_type(drv, (By.CSS_SELECTOR, "input[type='password']"), password)
  wait_click(drv, (By.XPATH, "//button[normalize-space()='Entrar']"))
  WebDriverWait(drv, 15).until(EC.url_matches(r".*/$"))


def goto_pets(drv):
  # Tenta clicar no link da navbar (desktop)
  try:
    el = WebDriverWait(drv, 8).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "a[href='/pets']")))
    drv.execute_script("arguments[0].click()", el)
    WebDriverWait(drv, 8).until(EC.url_contains('/pets'))
    return
  except Exception:
    pass

  # Tenta clicar no link da bottom-nav (mobile)
  try:
    el = WebDriverWait(drv, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.bottom-nav a[href='/pets']")))
    drv.execute_script("arguments[0].click()", el)
    WebDriverWait(drv, 8).until(EC.url_contains('/pets'))
    return
  except Exception:
    pass

  # Fallback: navega diretamente
  drv.get(f"{BASE_URL}/pets")
  WebDriverWait(drv, 8).until(EC.url_contains('/pets'))


def create_pet(drv, name: str):
  # garante visibilidade do botão e clica via JS (mais robusto contra overlays)
  btn = WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "button[data-testid='btn-open-pet-modal']")))
  drv.execute_script("arguments[0].scrollIntoView({behavior:'smooth',block:'center'});", btn)
  drv.execute_script("arguments[0].click()", btn)
  # modal aberto
  WebDriverWait(drv, 10).until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='pet-modal']")))
  wait_type(drv, (By.CSS_SELECTOR, "input[data-testid='pet-name']"), name)
  # Seleciona espécie (aleatória entre as opções presentes)
  species_select = Select(WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, "select[data-testid='pet-species']"))))
  options = [o.text for o in species_select.options]
  target = 'Cachorro' if 'Cachorro' in options else options[0]
  species_select.select_by_visible_text(target)
  
  # Campos opcionais para exercitar o formulário
  try:
    breed = drv.find_element(By.XPATH, "//input[@placeholder='Raça']")
    breed.clear(); breed.send_keys('SRD')
  except Exception:
    pass
  try:
    age = drv.find_element(By.XPATH, "//label[normalize-space()='Idade']/following::input[1]")
    age.clear(); age.send_keys('2')
  except Exception:
    pass
  try:
    notes = drv.find_element(By.XPATH, "//label[normalize-space()='Adicional']/following::input[1]")
    notes.clear(); notes.send_keys('Pet criado via E2E')
  except Exception:
    pass

  submit = WebDriverWait(drv, 10).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[data-testid='pet-submit']")))
  drv.execute_script("arguments[0].click()", submit)
  WebDriverWait(drv, 10).until(EC.invisibility_of_element_located((By.XPATH, "//h2[normalize-space()='Cadastrar Pet' or normalize-space()='Editar Pet']")))
  # garante que linha com o nome apareceu
  WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, f"//tbody//td[normalize-space()='{name}']")))


def edit_first_pet(drv):
  # clica no primeiro Editar
  wait_click(drv, (By.XPATH, "(//button[contains(., 'Editar')])[1]"))
  # altera observação
  el = WebDriverWait(drv, 10).until(EC.presence_of_element_located((By.XPATH, "//label[normalize-space()='Adicional']/following::input[1]")))
  el.clear(); el.send_keys(f"Observação {random.randint(1,999)}")
  wait_click(drv, (By.CSS_SELECTOR, "button[type='submit']"))
  WebDriverWait(drv, 10).until(EC.invisibility_of_element_located((By.XPATH, "//h2[normalize-space()='Cadastrar Pet' or normalize-space()='Editar Pet']")))


def delete_all_pets(drv):
  while True:
    rows = drv.find_elements(By.XPATH, "//tbody/tr")
    if not rows:
      break
    wait_click(drv, (By.XPATH, "(//button[contains(., 'Excluir')])[1]"))
    WebDriverWait(drv, 5).until(EC.alert_is_present())
    Alert(drv).accept()
    WebDriverWait(drv, 10).until(lambda d: len(d.find_elements(By.XPATH, "//tbody/tr")) < len(rows))


def flow_for_user(email: str, password: str):
  drv = make_driver(headless=HEADLESS)
  try:
    login(drv, email, password)
    goto_pets(drv)
    # criar 3 pets
    for i in range(3):
      create_pet(drv, name=f"Rex-{random.randint(1000,9999)}-{i+1}")
    # editar os 3 (uma por vez, sempre no topo)
    for _ in range(3):
      edit_first_pet(drv)
    # deletar todos
    delete_all_pets(drv)
    print(f"OK pets flow para {email}")
  finally:
    drv.quit()


def main():
  tutors = get_last_tutors(limit=2)
  if len(tutors) < 2:
    raise SystemExit('Base e2e.db não possui ao menos 2 tutores. Rode primeiro o test_register_login.py')
  for email, password in tutors:
    flow_for_user(email, password)


if __name__ == '__main__':
  main()


