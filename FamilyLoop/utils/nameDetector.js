export class NameDetector {
  constructor() {
    this.relationshipPatterns = {
      'Mother': ['mom', 'mommy', 'mama', 'ma', 'mother', 'mum', 'mummy'],
      'Father': ['dad', 'daddy', 'dada', 'papa', 'pa', 'father', 'pop', 'pops'],
      'Uncle': ['uncle', 'unc', 'tio'],
      'Aunt': ['aunt', 'aunty', 'auntie', 'tia'],
      'Sister': ['sis', 'sister'],
      'Brother': ['bro', 'brother'],
      'Grandmother': ['grandma', 'granny', 'nana', 'gram', 'grandmother'],
      'Grandfather': ['grandpa', 'gramps', 'grandfather'],
      'Cousin': ['cousin', 'cuz'],
      'Work': ['customer', 'support', 'office', 'manager', 'company', 'business', 'hr', 'boss'],
      'Friend': ['buddy', 'pal', 'bestie', 'bestfriend', 'best-friend', 'best friend']
    };
  }

  detectRelationship(contactName) {
    const name = contactName.toLowerCase();

    for (const [relationship, patterns] of Object.entries(this.relationshipPatterns)) {
      for (const pattern of patterns) {
        if (name.includes(pattern)) {
          return relationship;
        }
      }
    }

    return 'Contact'; // Default if no pattern matches
  }

  autoGroupContacts(contacts) {
    return contacts.map(contact => ({
      ...contact,
      relationship: this.detectRelationship(contact.name || ''),
      group: this.determineGroup(contact.name || '')
    }));
  }

  determineGroup(contactName) {
    const relationship = this.detectRelationship(contactName);

    if (['Mother', 'Father', 'Uncle', 'Aunt', 'Sister', 'Brother', 'Grandmother', 'Grandfather', 'Cousin'].includes(relationship)) {
      return 'Family';
    }
    if (relationship === 'Work') {
      return 'Work';
    }
    if (relationship === 'Friend') {
      return 'Friends';
    }

    return 'Contacts';
  }
}