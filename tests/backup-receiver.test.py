import hashlib
import importlib.util
import io
from pathlib import Path
import tarfile
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('receiver',Path(__file__).parent.parent/'deployment/backup-receiver.py')
receiver=importlib.util.module_from_spec(spec)
spec.loader.exec_module(receiver)

def archive(extra=None, bad_hash=False):
    values={'database.dump':b'postgres backup', 'packages.tar.gz':b'package backup'}
    values['SHA256SUMS']=''.join(f'{hashlib.sha256(value).hexdigest() if not bad_hash else "0"*64}  {name}\n' for name,value in values.items()).encode()
    data=io.BytesIO()
    with tarfile.open(fileobj=data,mode='w') as tar:
        for name,value in values.items():
            info=tarfile.TarInfo(name);info.size=len(value);tar.addfile(info,io.BytesIO(value))
        if extra:
            info=tarfile.TarInfo(extra)
            if extra=='symlink':info.type=tarfile.SYMTYPE;info.linkname='/tmp/escape'
            tar.addfile(info)
    data.seek(0);return data

class ReceiverTests(unittest.TestCase):
    def test_verified_pair_is_published_and_failed_upload_does_not_replace_it(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            result=receiver.receive(archive(),root)
            self.assertEqual((result/'database.dump').read_bytes(),b'postgres backup')
            for extra,bad_hash in [('../escape',False),('symlink',False),('database.dump',False),(None,True)]:
                with self.assertRaises(ValueError):receiver.receive(archive(extra,bad_hash),root)
            self.assertEqual([p for p in root.iterdir() if p.is_dir()],[result])
            self.assertEqual((result/'database.dump').read_bytes(),b'postgres backup')

    def test_retention_preserves_two_newest_and_unrelated_directories(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            names=['marketplace-20000101T000000Z','marketplace-20000102T000000Z','marketplace-20000103T000000Z','keep-me']
            for name in names:(root/name).mkdir()
            receiver.prune(root,30)
            self.assertFalse((root/names[0]).exists())
            self.assertTrue(all((root/name).exists() for name in names[1:]))

if __name__=='__main__':unittest.main()
