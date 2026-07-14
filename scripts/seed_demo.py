from telcoassist.tickets.seed import seed_tickets


def main() -> None:
    tickets = seed_tickets()
    print(f"Synthetic demo contains {len(tickets)} tickets")


if __name__ == "__main__":
    main()
