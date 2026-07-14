import logging
import time


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logging.info("TelcoAssist indexing worker ready")
    while True:
        time.sleep(30)


if __name__ == "__main__":
    main()
